// server-side only
import { generateJSON } from "./gemini";
import type { ShoppingProfile } from "@/lib/store";

export interface SearchStrategy {
  queries: string[];
  categories: string[];
  priceFilter: { min: number | null; max: number | null };
  sortBy: "relevance" | "price_asc" | "price_desc" | "popularity" | "rating";
  reasoning: string;
}

const SYSTEM_PROMPT = `
You are Kapi's search strategy engine for Kapruka, Sri Lanka's online gift & delivery platform.

Given a shopping profile, generate an optimal search strategy to find the best products.

Kapruka categories: gifts, flowers, cakes, electronics, fashion, lifestyle, food, beauty, books, home

RULES:
- Generate 3-6 diverse Kapruka search queries, from most specific to most general.
- Keep each query short and product-focused: 1-4 words is ideal.
- Do NOT include generic words like "Sri Lanka", "delivery", "best", "for mother", or "under 5000" in the query text.
- Put budget into priceFilter only, never into query text.
- If occasion is birthday, include cake/flower options.
- If recipient is mother, consider tea sets, sarees, jewelry, spa hampers.
- If recipient is father, consider gadgets, grooming kits, leather goods.
- Adjust queries based on budget tier:
  - Under Rs. 2,500: budget-friendly, practical
  - Rs. 5,000-10,000: mid-range, thoughtful
  - Rs. 20,000+: premium, luxury

OUTPUT: Return JSON only.

SCHEMA:
{
  "queries": string[],
  "categories": string[],
  "priceFilter": { "min": number | null, "max": number | null },
  "sortBy": "relevance" | "price_asc" | "price_desc" | "popularity" | "rating",
  "reasoning": string
}

EXAMPLES:

Profile: {"shoppingType":"gift","recipient":"mother","occasion":"birthday","budget":"under_5k","budgetMax":5000}
Output: {"queries":["tea gift","flowers","cake","chocolate hamper","saree"],"categories":["flowers","gifts","food"],"priceFilter":{"min":null,"max":5000},"sortBy":"relevance","reasoning":"Mother birthday gifts with emotional resonance; flowers and hampers are culturally appropriate in Sri Lanka."}

Profile: {"shoppingType":"myself","category":"electronics","budget":"under_5k","budgetMax":5000}
Output: {"queries":["electronics","bluetooth speaker","headphones","smart watch"],"categories":["electronics"],"priceFilter":{"min":null,"max":5000},"sortBy":"price_asc","reasoning":"Budget electronics; sorted by price to surface best value options."}

Profile: {"shoppingType":"gift","recipient":"partner","occasion":"anniversary","budget":"10k_20k","budgetMin":10000,"budgetMax":20000}
Output: {"queries":["rose bouquet","chocolate hamper","jewelry","spa hamper","premium gift"],"categories":["gifts","lifestyle","jewelry"],"priceFilter":{"min":10000,"max":20000},"sortBy":"rating","reasoning":"Anniversary gifts should feel romantic and personal; premium range allows for jewelry or experiences."}
`;

export async function generateSearchStrategy(
  profile: Partial<ShoppingProfile>
): Promise<SearchStrategy> {
  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nReturn JSON:`;
  return generateJSON<SearchStrategy>(prompt);
}
