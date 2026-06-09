import type { SearchStrategy } from "@/lib/ai/generateSearchQueries";
import { scoreProductsRelevance } from "@/lib/ai/scoreProductRelevance";
import type { ShoppingProfile } from "@/lib/store";
import { searchKaprukaProductsPerQuery } from "./kaprukaMcp";
import { MOCK_PRODUCTS } from "./mockData";
import {
  applyBudgetFilter,
  applyKeywordFilter,
  deduplicateProducts,
  keywordRelevanceScore,
} from "./productFilters";
import {
  MAX_PRODUCTS_TO_SCORE,
  MAX_RANKING_CANDIDATES,
  PRODUCTS_PER_QUERY,
} from "./retrievalConfig";
import type { RetrievalResult, ScoredProduct } from "./retrievalTypes";

interface RetrieveOptions {
  profile: Partial<ShoppingProfile>;
  strategy: SearchStrategy;
}

function searchMockPerQuery(
  queries: string[],
  priceFilter?: { min: number | null; max: number | null }
) {
  return queries.map((query) => {
    const words = query.toLowerCase().split(/\s+/);
    let pool = MOCK_PRODUCTS;

    if (priceFilter?.max != null) {
      pool = pool.filter((p) => p.price <= priceFilter.max! * 1.1);
    }
    if (priceFilter?.min != null) {
      pool = pool.filter((p) => p.price >= priceFilter.min!);
    }

    const scored = pool
      .map((p) => ({ product: p, score: keywordRelevanceScore(p, [query]) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      query,
      products: scored.slice(0, PRODUCTS_PER_QUERY).map((s) => s.product),
    };
  });
}

function resolveBudgetMax(
  profile: Partial<ShoppingProfile>,
  strategy: SearchStrategy
): number | null {
  return strategy.priceFilter?.max ?? profile.budgetMax ?? null;
}

export async function retrieveProducts(options: RetrieveOptions): Promise<RetrievalResult> {
  const { profile, strategy } = options;
  const queries = strategy.queries;
  const priceFilter = strategy.priceFilter;
  const budgetMax = resolveBudgetMax(profile, strategy);

  let perQueryResults = await searchKaprukaProductsPerQuery({
    queries,
    categories: strategy.categories,
    priceFilter,
    perQueryLimit: PRODUCTS_PER_QUERY,
  });

  const totalFromMcp = perQueryResults.reduce((sum, r) => sum + r.products.length, 0);
  if (totalFromMcp === 0) {
    perQueryResults = searchMockPerQuery(queries, priceFilter);
  }

  const productsPerQuery = perQueryResults.map((r) => ({
    query: r.query,
    count: r.products.length,
    productIds: r.products.map((p) => p.id),
  }));

  const merged = perQueryResults.flatMap((r) => r.products);
  const mergedCount = merged.length;

  const deduplicated = deduplicateProducts(merged);
  const deduplicatedCount = deduplicated.length;

  const { kept: afterKeyword, rejected: keywordRejections } = applyKeywordFilter(deduplicated);
  const { kept: afterBudget, rejected: budgetRejections } = applyBudgetFilter(
    afterKeyword,
    budgetMax
  );
  const filteredCount = afterBudget.length;

  const preRanked = [...afterBudget].sort(
    (a, b) => keywordRelevanceScore(b, queries) - keywordRelevanceScore(a, queries)
  );
  const toScore = preRanked.slice(0, MAX_PRODUCTS_TO_SCORE);

  const relevanceScores = await scoreProductsRelevance(profile, toScore);

  const acceptedScores = relevanceScores.filter((s) => s.shouldRecommend && !s.rejected);
  const relevanceRejections = relevanceScores.filter((s) => s.rejected || !s.shouldRecommend);

  const scoreById = new Map(relevanceScores.map((s) => [s.productId, s]));
  const candidates: ScoredProduct[] = acceptedScores
    .map((score) => {
      const product = toScore.find((p) => p.id === score.productId);
      if (!product) return null;
      return {
        ...product,
        relevanceScore: score.score,
        relevanceReasons: score.reasons,
      };
    })
    .filter((p): p is ScoredProduct => p !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_RANKING_CANDIDATES);

  const allRejected = [...keywordRejections, ...budgetRejections];
  const rejectedCount = allRejected.length + relevanceRejections.length;

  return {
    candidates,
    allProducts: candidates,
    relevanceScores,
    debug: {
      generatedQueries: queries,
      productsPerQuery,
      mergedCount,
      deduplicatedCount,
      filteredCount,
      rejectedCount,
      finalCandidateCount: candidates.length,
      keywordRejections,
      budgetRejections,
      relevanceRejections,
    },
  };
}
