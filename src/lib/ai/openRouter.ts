// OpenRouter client — server-side only, never import in client components
const OPENROUTER_API_URL = "https://api.openrouter.ai/v1/chat/completions";
const DEFAULT_MODEL = "nex-agi/nex-n2-pro-free";
const FALLBACK_MODEL = "deepseek/deepseek-chat-v3-0324";

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable");
  }
  return apiKey;
}

async function requestOpenRouter(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      top_p: 0.95,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const errorMessage = `OpenRouter request failed (${response.status}): ${body.slice(0, 400)}`;
    if (model === DEFAULT_MODEL && (response.status === 429 || response.status >= 500)) {
      return requestOpenRouter(prompt, FALLBACK_MODEL);
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(
      `OpenRouter returned unexpected response: ${JSON.stringify(json).slice(0, 400)}`
    );
  }

  return content;
}

function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error(`OpenRouter returned invalid JSON: ${text.slice(0, 200)}`);
  }
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const text = await requestOpenRouter(prompt, DEFAULT_MODEL);
  try {
    return parseJSON<T>(text);
  } catch (error) {
    if (error instanceof Error) {
      const fallbackText = await requestOpenRouter(prompt, FALLBACK_MODEL);
      try {
        return parseJSON<T>(fallbackText);
      } catch {
        throw new Error(
          `${error.message}; fallback result: ${fallbackText.slice(0, 200)}`
        );
      }
    }
    throw error;
  }
}
