// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";

export interface RankedProduct {
  productId: string;
  matchScore: number; // 0-100
  reasons: string[];
  variant: "best_pick" | "most_loved" | "unique_choice" | "other";
}

export interface RankingResult {
  topPick: RankedProduct | null;
  mostLoved: RankedProduct | null;
  uniqueChoice: RankedProduct | null;
  others: RankedProduct[];
  reasoning: string;
  totalConsidered: number;
}

export interface ProductInput {
  id: string;
  name: string;
  price: number;
  currency?: string;
  compareAtPrice?: number | null;
  category: string;
  tags: string[];
  rating?: number;
  reviewCount?: number;
  availableToday?: boolean;
  availableTomorrow?: boolean;
  inStock?: boolean;
  stockLevel?: string;
  description?: string;
  summary?: string;
  imageUrl?: string;
  url?: string;
  shipsInternationally?: boolean;
  source?: "kapruka" | "mock";
}

const SYSTEM_PROMPT = `
You are Kapi's recommendation ranking engine for Kapruka, Sri Lanka.

Given a shopping profile and a list of products, rank them into:
1. topPick — the single best match overall
2. mostLoved — highest rated / most reviewed
3. uniqueChoice — an unexpected but delightful option
4. others — remaining in ranked order

SCORING CRITERIA:
- Budget match (30%): How well does the price fit the stated budget?
- Occasion appropriateness (25%): Is this suitable for the occasion?
- Recipient fit (25%): Does this suit the recipient's likely preferences?
- Delivery feasibility (10%): Can it be delivered in time?
- Quality signals (10%): Rating, review count, popularity

For each product include 2-3 short, warm reasons (max 12 words each).
Reasons should feel personal, not robotic. E.g. "Perfect for a mom who loves cozy mornings."

OUTPUT: Return JSON only.

SCHEMA:
{
  "topPick": { "productId": string, "matchScore": number, "reasons": string[], "variant": "best_pick" },
  "mostLoved": { "productId": string, "matchScore": number, "reasons": string[], "variant": "most_loved" },
  "uniqueChoice": { "productId": string, "matchScore": number, "reasons": string[], "variant": "unique_choice" },
  "others": [{ "productId": string, "matchScore": number, "reasons": string[], "variant": "other" }],
  "reasoning": string,
  "totalConsidered": number
}
`;

export async function rankRecommendations(
  profile: Partial<ShoppingProfile>,
  products: ProductInput[]
): Promise<RankingResult> {
  if (products.length === 0) {
    return {
      topPick: null,
      mostLoved: null,
      uniqueChoice: null,
      others: [],
      reasoning: "No products to rank.",
      totalConsidered: 0,
    };
  }

  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nProducts to rank: ${JSON.stringify(products)}\n\nReturn JSON:`;
  return generateJSON<RankingResult>(prompt);
}
