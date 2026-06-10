// server-side only
import type { ShoppingProfile } from "@/lib/store";
import { resolveGiftStrategy } from "@/lib/persona/giftStrategyEngine";
import { classifyGiftType } from "@/lib/persona/heroGiftClassifier";
import { buildRecipientPersona } from "@/lib/persona/recipientPersona";
import type { ScoredProduct } from "@/services/commerce/retrievalTypes";
import { generateExplanations } from "./generateExplanations";

export interface RankedProduct {
  productId: string;
  matchScore: number;
  reasons: string[];
  variant: "best_match" | "most_thoughtful" | "surprise_pick" | "best_value" | "other";
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

function giftTypeOf(product: ScoredProduct): "HERO" | "SUPPORTING" {
  return product.giftType ?? classifyGiftType(product);
}

function buildRankedProduct(
  product: ScoredProduct,
  variant: RankedProduct["variant"],
  reasons?: string[]
): RankedProduct {
  return {
    productId: product.id,
    matchScore: product.relevanceScore,
    reasons: reasons ?? ["A strong match for your gift profile."],
    variant,
  };
}

function deterministicRanking(
  candidates: ScoredProduct[],
  profile: Partial<ShoppingProfile>
): RankingResult {
  const persona = buildRecipientPersona(profile);
  const giftStrategy = resolveGiftStrategy(persona);

  const heroes = candidates.filter((p) => giftTypeOf(p) === "HERO");
  const supporting = candidates.filter((p) => giftTypeOf(p) === "SUPPORTING");
  const heroPool = giftStrategy.heroGiftRequired && heroes.length > 0 ? heroes : candidates;

  const sortedHeroes = [...heroPool].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topPick = sortedHeroes[0] ? buildRankedProduct(sortedHeroes[0], "best_match") : null;

  const byRating = [...heroPool].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.relevanceScore - a.relevanceScore
  );
  const mostLoved =
    byRating[0] && byRating[0].id !== topPick?.productId
      ? buildRankedProduct(byRating[0], "most_thoughtful")
      : byRating[1]
        ? buildRankedProduct(byRating[1], "most_thoughtful")
        : null;

  const used = new Set([topPick?.productId, mostLoved?.productId].filter(Boolean));

  const surprisePool = sortedHeroes.filter((p) => !used.has(p.id));
  const uniqueChoice = surprisePool[0]
    ? buildRankedProduct(surprisePool[0], "surprise_pick")
    : null;
  if (uniqueChoice) used.add(uniqueChoice.productId);

  const addOnPool =
    giftStrategy.supportingGiftAllowed && supporting.length > 0
      ? [...supporting].sort((a, b) => b.relevanceScore - a.relevanceScore)
      : sortedHeroes.filter((p) => !used.has(p.id));

  const others = addOnPool
    .filter((p) => !used.has(p.id))
    .map((p) => buildRankedProduct(p, "best_value"));

  return {
    topPick,
    mostLoved,
    uniqueChoice,
    others,
    reasoning: `Ranked for ${giftStrategy.label} gift experience.`,
    totalConsidered: candidates.length,
  };
}

function applyExplanations(
  ranking: RankingResult,
  explanations: { productId: string; reasons: string[] }[],
  summary: string
): RankingResult {
  const byId = new Map(explanations.map((e) => [e.productId, e.reasons]));
  const slots: (RankedProduct | null)[] = [
    ranking.topPick,
    ranking.mostLoved,
    ranking.uniqueChoice,
    ...ranking.others,
  ];

  for (const slot of slots) {
    if (!slot) continue;
    const reasons = byId.get(slot.productId);
    if (reasons && reasons.length > 0) {
      slot.reasons = reasons;
    }
  }

  if (summary) ranking.reasoning = summary;
  return ranking;
}

export async function rankRecommendations(
  profile: Partial<ShoppingProfile>,
  candidates: ScoredProduct[]
): Promise<{ ranking: RankingResult; explanationMs: number }> {
  if (candidates.length === 0) {
    return {
      ranking: {
        topPick: null,
        mostLoved: null,
        uniqueChoice: null,
        others: [],
        reasoning: "No relevant products passed filtering and scoring.",
        totalConsidered: 0,
      },
      explanationMs: 0,
    };
  }

  const ranking = deterministicRanking(candidates, profile);

  const toExplain: ScoredProduct[] = [];
  const seen = new Set<string>();
  for (const slot of [ranking.topPick, ranking.mostLoved, ranking.uniqueChoice, ...ranking.others]) {
    if (!slot || seen.has(slot.productId)) continue;
    const product = candidates.find((c) => c.id === slot.productId);
    if (product) {
      toExplain.push(product);
      seen.add(slot.productId);
    }
  }

  const explainStart = performance.now();
  try {
    const { explanations, reasoning } = await generateExplanations(profile, toExplain);
    applyExplanations(ranking, explanations, reasoning);
  } catch {
    // Keep deterministic placeholder reasons
  }
  const explanationMs = Math.round(performance.now() - explainStart);

  return { ranking, explanationMs };
}
