import type { ProductInput } from "@/lib/ai/rankRecommendations";
import { BANNED_KEYWORDS, BUDGET_TOLERANCE_RATIO } from "./retrievalConfig";

export interface FilterRejection {
  product: ProductInput;
  reason: string;
  stage: "keyword" | "budget" | "compatibility";
}

function productHaystack(product: ProductInput): string {
  return [
    product.name,
    product.category,
    product.description ?? "",
    product.summary ?? "",
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function productQualityScore(product: ProductInput): number {
  let score = 0;
  if (product.imageUrl) score += 2;
  if (product.description || product.summary) score += 1;
  if (product.rating) score += product.rating;
  if (product.reviewCount) score += Math.min(product.reviewCount / 10, 5);
  if (product.inStock) score += 1;
  return score;
}

export function deduplicateProducts(products: ProductInput[]): ProductInput[] {
  const byKey = new Map<string, ProductInput>();

  for (const product of products) {
    const keys = uniqueKeys(product);
    let existing: ProductInput | undefined;
    for (const key of keys) {
      const found = byKey.get(key);
      if (found) {
        existing = found;
        break;
      }
    }

    if (!existing) {
      for (const key of keys) byKey.set(key, product);
      continue;
    }

    if (productQualityScore(product) > productQualityScore(existing)) {
      for (const key of keys) byKey.set(key, product);
    }
  }

  const seen = new Set<string>();
  const result: ProductInput[] = [];
  for (const product of byKey.values()) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
  }
  return result;
}

function uniqueKeys(product: ProductInput): string[] {
  const keys = [`id:${product.id}`];
  if (product.url) keys.push(`url:${normalizeUrl(product.url)}`);
  return keys;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

export function applyKeywordFilter(
  products: ProductInput[],
  bannedKeywords: string[] = BANNED_KEYWORDS
): { kept: ProductInput[]; rejected: FilterRejection[] } {
  const kept: ProductInput[] = [];
  const rejected: FilterRejection[] = [];

  for (const product of products) {
    const haystack = productHaystack(product);
    const match = bannedKeywords.find((keyword) => haystack.includes(keyword.toLowerCase()));
    if (match) {
      rejected.push({
        product,
        reason: `Banned keyword: "${match}"`,
        stage: "keyword",
      });
    } else {
      kept.push(product);
    }
  }

  return { kept, rejected };
}

export function applyBudgetFilter(
  products: ProductInput[],
  budgetMax: number | null | undefined,
  toleranceRatio = BUDGET_TOLERANCE_RATIO
): { kept: ProductInput[]; rejected: FilterRejection[] } {
  if (budgetMax == null || budgetMax <= 0) {
    return { kept: products, rejected: [] };
  }

  const ceiling = budgetMax * (1 + toleranceRatio);
  const kept: ProductInput[] = [];
  const rejected: FilterRejection[] = [];

  for (const product of products) {
    if (product.price > ceiling) {
      rejected.push({
        product,
        reason: `Over budget: Rs. ${product.price.toLocaleString()} > Rs. ${Math.round(ceiling).toLocaleString()}`,
        stage: "budget",
      });
    } else {
      kept.push(product);
    }
  }

  return { kept, rejected };
}

/** Lightweight pre-score to prioritize products before AI relevance scoring. */
export function keywordRelevanceScore(product: ProductInput, queries: string[]): number {
  const haystack = productHaystack(product);
  let score = 0;

  for (const query of queries) {
    for (const word of query.toLowerCase().split(/\s+/)) {
      if (word.length > 2 && haystack.includes(word)) {
        score += word.length > 5 ? 3 : 1;
      }
    }
  }

  if (product.rating) score += product.rating;
  return score;
}
