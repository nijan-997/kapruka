// server-side only
import { generateJSON } from "./openRouter";
import type { SearchStrategy } from "./generateSearchQueries";
import type { ShoppingProfile } from "@/lib/store";
import { buildRecipientPersona, personaSearchContext } from "@/lib/persona/recipientPersona";
import { MAX_SEARCH_QUERIES } from "@/services/commerce/retrievalConfig";

const SYSTEM_PROMPT = `
You are Kapi's alternative discovery engine for Kapruka, Sri Lanka.

The user has already seen initial recommendations and wants DIFFERENT gift ideas.
Generate a fresh search strategy that explores new product directions.

Explore angles such as:
- Experience gifts
- Premium / luxury gifts
- Personalized gifts
- Practical gifts
- Unique / surprise gifts
- Artisan / handcrafted gifts
- Gourmet / food experiences

RULES:
- Generate exactly 5 queries: 3 primary + 2 supporting.
- Do NOT repeat or closely paraphrase any query from previousQueries.
- Intentionally shift category focus away from what was already searched.
- Keep queries short (1-4 words), product-focused.
- Put budget in priceFilter only.
- Avoid book queries unless explicitly requested.

OUTPUT: Return JSON only.

SCHEMA:
{
  "queries": string[],
  "categories": string[],
  "priceFilter": { "min": number | null, "max": number | null },
  "sortBy": "relevance" | "price_asc" | "price_desc" | "popularity" | "rating",
  "reasoning": string
}
`;

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries
    .map((q) => q.trim().toLowerCase())
    .filter((q) => {
      if (!q || q.length < 3 || seen.has(q)) return false;
      seen.add(q);
      return true;
    });
}

export async function generateExploreStrategy(
  profile: Partial<ShoppingProfile>,
  previousQueries: string[]
): Promise<SearchStrategy> {
  const persona = buildRecipientPersona(profile);
  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nRecipient persona: ${personaSearchContext(persona)}\n\nPrevious queries to AVOID: ${JSON.stringify(previousQueries)}\n\nReturn JSON:`;
  const strategy = await generateJSON<SearchStrategy>(prompt);
  const queries = uniqueQueries(strategy.queries ?? []).slice(0, MAX_SEARCH_QUERIES);
  const heroQueries = queries.slice(0, 3);
  const supportingQueries = queries.slice(3, 5);
  return {
    ...strategy,
    queries,
    heroQueries,
    supportingQueries,
    categories: strategy.categories ?? ["gifts", "lifestyle"],
    priceFilter: strategy.priceFilter ?? {
      min: profile.budgetMin ?? null,
      max: profile.budgetMax ?? null,
    },
    sortBy: strategy.sortBy ?? "relevance",
    reasoning: strategy.reasoning ?? "Alternative discovery search",
  };
}
