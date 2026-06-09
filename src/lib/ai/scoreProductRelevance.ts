// server-side only
import { generateJSON } from "./openRouter";
import type { ProductInput } from "./rankRecommendations";
import type { ShoppingProfile } from "@/lib/store";
import { MIN_RELEVANCE_SCORE } from "@/services/commerce/retrievalConfig";

export interface ProductRelevanceScore {
  productId: string;
  score: number;
  reasons: string[];
  shouldRecommend: boolean;
  rejected: boolean;
}

const SYSTEM_PROMPT = `
You are Kapi's product relevance scorer for Kapruka, Sri Lanka.

Given a shopping profile and a list of products, score EACH product for how well it fits as a recommendation.

SCORING CRITERIA (0-100):
- Recipient fit (25%): Does this suit the recipient?
- Occasion fit (25%): Is this appropriate for the occasion?
- Interest fit (25%): Does it match stated interests?
- Budget fit (15%): Is the price reasonable for the budget?
- Gift suitability (10%): Would someone actually gift this?

RULES:
- Score 0-100 for each product.
- shouldRecommend = true only if score >= ${MIN_RELEVANCE_SCORE}.
- rejected = true if score < ${MIN_RELEVANCE_SCORE}.
- Provide 2-3 short reasons per product (max 12 words each).
- Be strict: children's books, school supplies, and unrelated items must score below ${MIN_RELEVANCE_SCORE} for adult/professional gift requests.
- Never inflate scores for poor matches.

OUTPUT: Return JSON only.

SCHEMA:
{
  "scores": [
    {
      "productId": string,
      "score": number,
      "reasons": string[],
      "shouldRecommend": boolean,
      "rejected": boolean
    }
  ]
}
`;

const BATCH_SIZE = 12;

export async function scoreProductRelevance(
  profile: Partial<ShoppingProfile>,
  product: ProductInput
): Promise<ProductRelevanceScore> {
  const [result] = await scoreProductsRelevance(profile, [product]);
  return result;
}

export async function scoreProductsRelevance(
  profile: Partial<ShoppingProfile>,
  products: ProductInput[]
): Promise<ProductRelevanceScore[]> {
  if (products.length === 0) return [];

  const allScores: ProductRelevanceScore[] = [];

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const compact = batch.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      tags: p.tags.slice(0, 6),
      summary: (p.summary ?? p.description ?? "").slice(0, 120),
    }));

    const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nProducts to score: ${JSON.stringify(compact)}\n\nReturn JSON:`;

    try {
      const result = await generateJSON<{ scores: ProductRelevanceScore[] }>(prompt);
      const byId = new Map(result.scores.map((s) => [s.productId, normalizeScore(s)]));

      for (const product of batch) {
        allScores.push(
          byId.get(product.id) ?? fallbackScore(product, profile, "AI did not return a score")
        );
      }
    } catch {
      for (const product of batch) {
        allScores.push(fallbackScore(product, profile, "Scoring fallback"));
      }
    }
  }

  return allScores;
}

function normalizeScore(raw: ProductRelevanceScore): ProductRelevanceScore {
  const score = Math.max(0, Math.min(100, Math.round(raw.score)));
  const shouldRecommend = score >= MIN_RELEVANCE_SCORE && raw.shouldRecommend !== false;
  return {
    productId: raw.productId,
    score,
    reasons: raw.reasons?.slice(0, 3) ?? [],
    shouldRecommend,
    rejected: !shouldRecommend,
  };
}

function fallbackScore(
  product: ProductInput,
  profile: Partial<ShoppingProfile>,
  reason: string
): ProductRelevanceScore {
  let score = 40;
  const haystack = [product.name, product.category, ...product.tags].join(" ").toLowerCase();
  const interests = (profile.interests ?? []).join(" ").toLowerCase();
  const recipient = (profile.recipient || profile.recipientCustom || "").toLowerCase();

  if (interests) {
    for (const word of interests.split(/\s+/)) {
      if (word.length > 3 && haystack.includes(word)) score += 15;
    }
  }

  if (recipient && ["boss", "colleague", "client"].includes(recipient)) {
    if (/book|school|children|nursery|exercise|activity/i.test(haystack)) score = 20;
    if (/gift|executive|office|travel|mug|notebook|pen|organizer/i.test(haystack)) score += 10;
  }

  if (profile.budgetMax && product.price <= profile.budgetMax) score += 10;
  score = Math.max(0, Math.min(100, score));

  return {
    productId: product.id,
    score,
    reasons: [reason],
    shouldRecommend: score >= MIN_RELEVANCE_SCORE,
    rejected: score < MIN_RELEVANCE_SCORE,
  };
}
