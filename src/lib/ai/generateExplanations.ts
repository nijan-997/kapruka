// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";
import type { ScoredProduct } from "@/services/commerce/retrievalTypes";
import { MAX_EXPLANATION_PRODUCTS } from "@/services/commerce/retrievalConfig";

export interface ProductExplanation {
  productId: string;
  reasons: string[];
}

export interface ExplanationResult {
  explanations: ProductExplanation[];
  reasoning: string;
}

const SYSTEM_PROMPT = `
You are Kapi, Kapruka's AI shopping concierge for Sri Lanka.

You will receive pre-selected gift recommendations that have already been ranked by code.
Your ONLY job is to write human-friendly explanations — do NOT rank, score, or reject products.

For each product, write 2-3 thoughtful reasons (max 18 words each).
Reasons must feel like personal advice from a thoughtful friend, not algorithm output.
Example: "I picked this because your boss is retiring after a long career and this personalized recognition piece creates a lasting reminder of their impact."
Never say "tech-related gift" or generic labels.

OUTPUT: Return JSON only.

SCHEMA:
{
  "explanations": [
    { "productId": string, "reasons": string[] }
  ],
  "reasoning": string
}
`;

export async function generateExplanations(
  profile: Partial<ShoppingProfile>,
  products: ScoredProduct[]
): Promise<ExplanationResult> {
  const top = products.slice(0, MAX_EXPLANATION_PRODUCTS);
  if (top.length === 0) {
    return { explanations: [], reasoning: "No products to explain." };
  }

  const compact = top.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    score: p.relevanceScore,
  }));

  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nPre-selected products to explain: ${JSON.stringify(compact)}\n\nReturn JSON:`;
  return generateJSON<ExplanationResult>(prompt);
}
