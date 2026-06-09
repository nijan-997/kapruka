import { MOCK_PRODUCTS } from "./mockData";
import { searchKaprukaProducts } from "./kaprukaMcp";
import type { ProductInput } from "@/lib/ai/rankRecommendations";

interface SearchOptions {
  queries: string[];
  priceFilter?: { min: number | null; max: number | null };
  categories?: string[];
  limit?: number;
}

function scoreProduct(product: ProductInput, queries: string[]): number {
  const haystack = [
    product.name,
    product.category,
    product.description ?? "",
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const query of queries) {
    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && haystack.includes(word)) {
        score += word.length > 5 ? 3 : 1;
      }
    }
  }
  // Boost by rating
  if (product.rating) score += product.rating;
  return score;
}

export async function searchProducts(options: SearchOptions): Promise<ProductInput[]> {
  try {
    const kaprukaResults = await searchKaprukaProducts(options);
    if (kaprukaResults.length > 0) {
      return kaprukaResults;
    }
  } catch (err) {
    console.warn("[commerce/searchProducts] Kapruka MCP unavailable, using mock fallback", err);
  }

  const { queries, priceFilter, limit = 12 } = options;

  let results = MOCK_PRODUCTS;

  // Apply price filter
  if (priceFilter?.max != null) {
    results = results.filter((p) => p.price <= priceFilter.max!);
  }
  if (priceFilter?.min != null) {
    results = results.filter((p) => p.price >= priceFilter.min!);
  }

  // Score and sort by relevance to queries
  const scored = results.map((p) => ({ product: p, score: scoreProduct(p, queries) }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}
