// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";
import type { ScoredProduct } from "@/services/commerce/retrievalTypes";

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

You will receive ONLY pre-filtered, relevance-scored products that already passed quality checks.
Do NOT rank products outside the provided list.

Rank them into:
1. topPick — the single best match overall (must be the highest relevance fit)
2. mostLoved — highest rated / most reviewed
3. uniqueChoice — an unexpected but delightful option
4. others — remaining in ranked order

Each product includes a relevanceScore from prior scoring. Prefer higher relevanceScore for topPick.

For each product include 2-3 short, warm reasons (max 12 words each).

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

function buildRankedProduct(
  product: ScoredProduct,
  variant: RankedProduct["variant"]
): RankedProduct {
  return {
    productId: product.id,
    matchScore: product.relevanceScore,
    reasons: product.relevanceReasons.length > 0 ? product.relevanceReasons : ["Great match for your request"],
    variant,
  };
}

function enforceTopPick(ranking: RankingResult, candidates: ScoredProduct[]): RankingResult {
  if (candidates.length === 0) return ranking;

  const allowedIds = new Set(candidates.map((p) => p.id));
  const best = candidates[0];

  const topPickValid =
    ranking.topPick && allowedIds.has(ranking.topPick.productId);
  const topPickScore = topPickValid
    ? candidates.find((p) => p.id === ranking.topPick!.productId)?.relevanceScore ?? 0
    : 0;

  if (!topPickValid || topPickScore < best.relevanceScore) {
    ranking.topPick = buildRankedProduct(best, "best_pick");
  }

  return ranking;
}

function deterministicRanking(candidates: ScoredProduct[]): RankingResult {
  const sorted = [...candidates].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topPick = sorted[0] ? buildRankedProduct(sorted[0], "best_pick") : null;

  const byRating = [...candidates].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.relevanceScore - a.relevanceScore
  );
  const mostLoved =
    byRating[0] && byRating[0].id !== topPick?.productId
      ? buildRankedProduct(byRating[0], "most_loved")
      : byRating[1]
        ? buildRankedProduct(byRating[1], "most_loved")
        : null;

  const used = new Set([topPick?.productId, mostLoved?.productId].filter(Boolean));
  const uniqueChoice =
    sorted.find((p) => !used.has(p.id)) != null
      ? buildRankedProduct(sorted.find((p) => !used.has(p.id))!, "unique_choice")
      : null;

  if (uniqueChoice) used.add(uniqueChoice.productId);

  const others = sorted
    .filter((p) => !used.has(p.id))
    .map((p) => buildRankedProduct(p, "other"));

  return {
    topPick,
    mostLoved,
    uniqueChoice,
    others,
    reasoning: "Ranked from pre-scored relevant candidates.",
    totalConsidered: candidates.length,
  };
}

export async function rankRecommendations(
  profile: Partial<ShoppingProfile>,
  candidates: ScoredProduct[]
): Promise<RankingResult> {
  if (candidates.length === 0) {
    return {
      topPick: null,
      mostLoved: null,
      uniqueChoice: null,
      others: [],
      reasoning: "No relevant products passed filtering and scoring.",
      totalConsidered: 0,
    };
  }

  if (candidates.length === 1) {
    return deterministicRanking(candidates);
  }

  const compact = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    relevanceScore: p.relevanceScore,
    relevanceReasons: p.relevanceReasons,
    rating: p.rating,
    reviewCount: p.reviewCount,
  }));

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nPre-scored products to rank: ${JSON.stringify(compact)}\n\nReturn JSON:`;
    const ranking = await generateJSON<RankingResult>(prompt);
    ranking.totalConsidered = candidates.length;
    return enforceTopPick(ranking, candidates);
  } catch {
    return deterministicRanking(candidates);
  }
}
