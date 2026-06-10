import type { SearchStrategy } from "@/lib/ai/generateSearchQueries";
import { resolveGiftStrategy } from "@/lib/persona/giftStrategyEngine";
import { buildRecipientPersona } from "@/lib/persona/recipientPersona";
import { applyRecipientCompatibilityFilter } from "@/lib/persona/recipientCompatibility";
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
  EARLY_STOP_PRODUCT_COUNT,
  PRODUCTS_PER_QUERY,
  TOP_CANDIDATE_LIMIT,
} from "./retrievalConfig";
import { scoreProducts } from "./scoreProduct";
import type { RetrievalResult, ScoredProduct } from "./retrievalTypes";

interface RetrieveOptions {
  profile: Partial<ShoppingProfile>;
  strategy: SearchStrategy;
  excludeProductIds?: string[];
}

function searchMockPerQuery(
  queries: string[],
  priceFilter?: { min: number | null; max: number | null }
) {
  return queries.map((query) => {
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
  const { profile, strategy, excludeProductIds = [] } = options;
  const excludeSet = new Set(excludeProductIds);
  const queries = strategy.queries;
  const priceFilter = strategy.priceFilter;
  const budgetMax = resolveBudgetMax(profile, strategy);
  const pipelineStart = performance.now();

  const persona = buildRecipientPersona(profile);
  const giftStrategy = resolveGiftStrategy(persona);

  const mcpStart = performance.now();
  let perQueryResults = await searchKaprukaProductsPerQuery({
    queries,
    categories: strategy.categories,
    priceFilter,
    perQueryLimit: PRODUCTS_PER_QUERY,
  });
  const mcpRetrievalMs = performance.now() - mcpStart;

  const totalFromMcp = perQueryResults.reduce((sum, r) => sum + r.products.length, 0);
  if (totalFromMcp === 0) {
    perQueryResults = searchMockPerQuery(queries, priceFilter);
  }

  const productsPerQuery = perQueryResults.map((r) => ({
    query: r.query,
    count: r.products.length,
    productIds: r.products.map((p) => p.id),
  }));

  const mergeStart = performance.now();
  const merged = perQueryResults.flatMap((r) => r.products);
  const mergedCount = merged.length;
  const mergeMs = performance.now() - mergeStart;

  const dedupeStart = performance.now();
  const deduplicated = deduplicateProducts(merged);
  const deduplicatedCount = deduplicated.length;
  const deduplicationMs = performance.now() - dedupeStart;

  const filterStart = performance.now();
  const { kept: afterKeyword, rejected: keywordRejections } = applyKeywordFilter(deduplicated);
  const { kept: afterBudget, rejected: budgetRejections } = applyBudgetFilter(
    afterKeyword,
    budgetMax
  );
  const { kept: afterCompatibility, rejected: compatibilityRejections } =
    applyRecipientCompatibilityFilter(afterBudget, profile);
  const afterExclusion = afterCompatibility.filter((p) => !excludeSet.has(p.id));
  const filteredCount = afterExclusion.length;
  const filteringMs = performance.now() - filterStart;

  const scoringStart = performance.now();
  const deterministicScores = scoreProducts(afterExclusion, profile, giftStrategy);
  const acceptedScores = deterministicScores.filter((s) => s.accepted);
  const scoreRejections = deterministicScores.filter((s) => !s.accepted);

  const allScoredProducts = acceptedScores
    .map((score) => {
      const product = afterExclusion.find((p) => p.id === score.productId);
      if (!product) return null;
      const scored: ScoredProduct = {
        ...product,
        relevanceScore: score.score,
        relevanceReasons: [],
        giftType: score.giftType,
      };
      return scored;
    })
    .filter((p): p is ScoredProduct => p !== null);

  const candidates = allScoredProducts.slice(0, TOP_CANDIDATE_LIMIT);
  const scoringMs = performance.now() - scoringStart;

  const heroGiftCount = allScoredProducts.filter((p) => p.giftType === "HERO").length;
  const supportingGiftCount = allScoredProducts.filter((p) => p.giftType === "SUPPORTING").length;

  const rejectedCount =
    keywordRejections.length +
    budgetRejections.length +
    compatibilityRejections.length +
    scoreRejections.length;
  const earlyStopTriggered = deduplicatedCount >= EARLY_STOP_PRODUCT_COUNT;

  const performanceMs = {
    mcpRetrievalMs: Math.round(mcpRetrievalMs),
    mergeMs: Math.round(mergeMs),
    deduplicationMs: Math.round(deduplicationMs),
    filteringMs: Math.round(filteringMs),
    scoringMs: Math.round(scoringMs),
    totalMs: Math.round(performance.now() - pipelineStart),
  };

  return {
    candidates,
    allScoredProducts,
    allProducts: allScoredProducts,
    deterministicScores,
    giftStrategy,
    debug: {
      generatedQueries: queries,
      heroQueries: strategy.heroQueries ?? queries.slice(0, 3),
      supportingQueries: strategy.supportingQueries ?? queries.slice(3),
      giftStrategy: giftStrategy.strategy,
      giftStrategyLabel: giftStrategy.label,
      productsPerQuery,
      mergedCount,
      deduplicatedCount,
      filteredCount,
      rejectedCount,
      finalCandidateCount: allScoredProducts.length,
      heroGiftCount,
      supportingGiftCount,
      keywordRejections,
      budgetRejections,
      compatibilityRejections,
      scoreRejections,
      performanceMs,
      earlyStopTriggered,
    },
  };
}
