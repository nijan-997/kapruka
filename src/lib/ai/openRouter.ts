// OpenRouter client — server-side only, never import in client components
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "nex-agi/nex-n2-pro-free";
const FALLBACK_MODEL = "deepseek/deepseek-chat-v3-0324";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable");
  }
  return apiKey;
}

function getSiteUrl(): string {
  return process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status >= 500;
}

function extractMessageContent(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;

  const choices = (json as { choices?: unknown[] }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const message = (choices[0] as { message?: { content?: unknown } }).message;
  const content = message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  // Some models return content as an array of parts
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("")
      .trim();
    if (text) return text;
  }

  return null;
}

async function requestOpenRouter(
  prompt: string,
  model = DEFAULT_MODEL,
  attempt = 0,
  useJsonMode = true
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getSiteUrl(),
        "X-OpenRouter-Title": "Kapi by Kapruka",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for Kapruka shopping. Follow instructions exactly and return only the requested output format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        top_p: 0.95,
        max_tokens: 2000,
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const errorMessage = `OpenRouter request failed (${response.status}): ${body.slice(0, 400)}`;

      // Some models reject json_object mode — retry without it
      if (useJsonMode && response.status === 400) {
        return requestOpenRouter(prompt, model, attempt, false);
      }

      if (model === DEFAULT_MODEL && isRetryableStatus(response.status)) {
        return requestOpenRouter(prompt, FALLBACK_MODEL, 0, useJsonMode);
      }

      if (attempt < MAX_RETRIES && isRetryableStatus(response.status)) {
        await sleep(500 * (attempt + 1));
        return requestOpenRouter(prompt, model, attempt + 1, useJsonMode);
      }

      throw new Error(errorMessage);
    }

    const json = await response.json();
    const content = extractMessageContent(json);
    if (!content) {
      const preview = JSON.stringify(json).slice(0, 400);
      if (model === DEFAULT_MODEL) {
        return requestOpenRouter(prompt, FALLBACK_MODEL, 0, useJsonMode);
      }
      throw new Error(`OpenRouter returned unexpected response: ${preview}`);
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (model === DEFAULT_MODEL) {
        return requestOpenRouter(prompt, FALLBACK_MODEL, 0, useJsonMode);
      }
      throw new Error("OpenRouter request timed out");
    }

    if (
      model === DEFAULT_MODEL &&
      error instanceof Error &&
      !error.message.includes("Missing OPENROUTER_API_KEY")
    ) {
      try {
        return await requestOpenRouter(prompt, FALLBACK_MODEL, 0, useJsonMode);
      } catch {
        throw error;
      }
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJSON<T>(text: string): T {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Markdown code block
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) {
      return JSON.parse(fenced[1]) as T;
    }

    // First JSON object in the response
    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }

    throw new Error(`OpenRouter returned invalid JSON: ${trimmed.slice(0, 200)}`);
  }
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await requestOpenRouter(prompt, DEFAULT_MODEL);
  try {
    return parseJSON<T>(text);
  } catch (error) {
    if (!(error instanceof Error)) throw error;

    const fallbackText = await requestOpenRouter(prompt, FALLBACK_MODEL);
    try {
      return parseJSON<T>(fallbackText);
    } catch {
      throw new Error(`${error.message}; fallback result: ${fallbackText.slice(0, 200)}`);
    }
  }
}
