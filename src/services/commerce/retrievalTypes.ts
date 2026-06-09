import type { ProductRelevanceScore } from "@/lib/ai/scoreProductRelevance";
import type { ProductInput } from "@/lib/ai/rankRecommendations";
import type { FilterRejection } from "./productFilters";

export interface QuerySearchResult {
  query: string;
  count: number;
  productIds: string[];
}

export interface RetrievalDebug {
  generatedQueries: string[];
  productsPerQuery: QuerySearchResult[];
  mergedCount: number;
  deduplicatedCount: number;
  filteredCount: number;
  rejectedCount: number;
  finalCandidateCount: number;
  keywordRejections: FilterRejection[];
  budgetRejections: FilterRejection[];
  relevanceRejections: ProductRelevanceScore[];
}

export interface ScoredProduct extends ProductInput {
  relevanceScore: number;
  relevanceReasons: string[];
}

export interface RetrievalResult {
  candidates: ScoredProduct[];
  allProducts: ProductInput[];
  debug: RetrievalDebug;
  relevanceScores: ProductRelevanceScore[];
}
