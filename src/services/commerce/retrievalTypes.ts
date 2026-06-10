import type { ProductInput } from "@/lib/ai/rankRecommendations";
import type { FilterRejection } from "./productFilters";
import type { ProductScore } from "./scoreProduct";

export interface QuerySearchResult {
  query: string;
  count: number;
  productIds: string[];
}

export interface PerformanceTimings {
  searchStrategyMs?: number;
  mcpRetrievalMs: number;
  mergeMs: number;
  deduplicationMs: number;
  filteringMs: number;
  scoringMs: number;
  explanationMs?: number;
  rankingMs?: number;
  totalMs?: number;
}

export interface RetrievalDebug {
  generatedQueries: string[];
  heroQueries: string[];
  supportingQueries: string[];
  giftStrategy: string;
  giftStrategyLabel: string;
  productsPerQuery: QuerySearchResult[];
  mergedCount: number;
  deduplicatedCount: number;
  filteredCount: number;
  rejectedCount: number;
  finalCandidateCount: number;
  heroGiftCount: number;
  supportingGiftCount: number;
  keywordRejections: FilterRejection[];
  budgetRejections: FilterRejection[];
  compatibilityRejections: FilterRejection[];
  scoreRejections: ProductScore[];
  performanceMs: PerformanceTimings;
  earlyStopTriggered: boolean;
}

export interface ScoredProduct extends ProductInput {
  relevanceScore: number;
  relevanceReasons: string[];
  giftType?: "HERO" | "SUPPORTING";
}

export interface RetrievalResult {
  candidates: ScoredProduct[];
  allScoredProducts: ScoredProduct[];
  allProducts: ProductInput[];
  deterministicScores: ProductScore[];
  giftStrategy: import("@/lib/persona/giftStrategyEngine").GiftStrategy;
  debug: RetrievalDebug;
}
