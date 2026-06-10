/**
 * Recommendation browse architecture
 *
 * First load runs the full AI + MCP pipeline once and caches all scored products.
 * "Show More Matches" paginates from cache instantly (no API).
 * "Explore Different Ideas" runs a new discovery pipeline excluding seen product IDs.
 */
import type { RankingResult, ProductInput } from "@/lib/ai/rankRecommendations";
import type { ScoredProduct } from "@/services/commerce/retrievalTypes";

export const RECOMMENDATION_PAGE_SIZE = 10;

export interface BrowseProduct {
  product: ProductInput;
  matchScore: number;
  variant: "best_value" | "other";
  reasons: string[];
}

export interface RecommendationSession {
  id: string;
  type: "initial" | "explore";
  createdAt: number;
  /** All scored products retrieved in this session, sorted by match score. */
  allRecommendations: BrowseProduct[];
  strategyReasoning?: string;
}

export interface RecommendationAnalytics {
  totalRetrieved: number;
  totalDisplayed: number;
  remainingCount: number;
  loadMoreClicks: number;
  exploreDifferentIdeasClicks: number;
}

export interface RecommendationBrowseState {
  sessions: RecommendationSession[];
  seenProductIds: string[];
  /** How many non-hero browse products are currently visible. */
  displayedCount: number;
  pageSize: number;
  isExploring: boolean;
  analytics: RecommendationAnalytics;
}

export const defaultBrowseState: RecommendationBrowseState = {
  sessions: [],
  seenProductIds: [],
  displayedCount: 0,
  pageSize: RECOMMENDATION_PAGE_SIZE,
  isExploring: false,
  analytics: {
    totalRetrieved: 0,
    totalDisplayed: 0,
    remainingCount: 0,
    loadMoreClicks: 0,
    exploreDifferentIdeasClicks: 0,
  },
};

export function scoredToBrowseProduct(item: ScoredProduct): BrowseProduct {
  return {
    product: item,
    matchScore: item.relevanceScore,
    variant: "best_value",
    reasons: item.relevanceReasons.length > 0 ? item.relevanceReasons : [],
  };
}

export function buildBrowseProducts(items: ScoredProduct[]): BrowseProduct[] {
  return items.map(scoredToBrowseProduct);
}

/** Merge all session pools, deduplicated by product ID (first occurrence wins). */
export function getCombinedRecommendations(sessions: RecommendationSession[]): BrowseProduct[] {
  const seen = new Set<string>();
  const combined: BrowseProduct[] = [];
  for (const session of sessions) {
    for (const item of session.allRecommendations) {
      if (seen.has(item.product.id)) continue;
      seen.add(item.product.id);
      combined.push(item);
    }
  }
  return combined;
}

export function getHeroProductIds(ranking: RankingResult | null): Set<string> {
  const ids = new Set<string>();
  if (!ranking) return ids;
  if (ranking.topPick?.productId) ids.add(ranking.topPick.productId);
  if (ranking.mostLoved?.productId) ids.add(ranking.mostLoved.productId);
  if (ranking.uniqueChoice?.productId) ids.add(ranking.uniqueChoice.productId);
  return ids;
}

/** Browse pool excludes hero cards shown in the primary section. */
export function getBrowsePool(
  sessions: RecommendationSession[],
  heroIds: Set<string>
): BrowseProduct[] {
  return getCombinedRecommendations(sessions).filter((item) => !heroIds.has(item.product.id));
}

export function computeBrowseAnalytics(
  sessions: RecommendationSession[],
  heroIds: Set<string>,
  displayedCount: number,
  loadMoreClicks: number,
  exploreClicks: number
): RecommendationAnalytics {
  const pool = getBrowsePool(sessions, heroIds);
  const totalRetrieved = getCombinedRecommendations(sessions).length;
  const totalDisplayed = Math.min(displayedCount, pool.length);
  const remainingCount = Math.max(0, pool.length - totalDisplayed);

  return {
    totalRetrieved,
    totalDisplayed,
    remainingCount,
    loadMoreClicks,
    exploreDifferentIdeasClicks: exploreClicks,
  };
}

export function createSessionId(type: "initial" | "explore"): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
