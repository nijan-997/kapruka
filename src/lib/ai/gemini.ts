// Gemini client — server-side only, never import in client components
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export function getModel(modelName = "gemini-2.5-flash"): GenerativeModel {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      responseMimeType: "application/json",
    },
  });
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try extracting JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
}
