// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";
import {
  buildRecipientPersona,
  personaAgeGroupLabel,
  personaGenderLabel,
  personaSearchContext,
} from "@/lib/persona/recipientPersona";
import {
  giftStrategySearchHints,
  resolveGiftStrategy,
} from "@/lib/persona/giftStrategyEngine";
import { MAX_SEARCH_QUERIES } from "@/services/commerce/retrievalConfig";

export interface SearchStrategy {
  /** Combined queries sent to MCP (hero first, then supporting). */
  queries: string[];
  heroQueries: string[];
  supportingQueries: string[];
  categories: string[];
  priceFilter: { min: number | null; max: number | null };
  sortBy: "relevance" | "price_asc" | "price_desc" | "popularity" | "rating";
  reasoning: string;
  giftStrategy?: string;
}

const SYSTEM_PROMPT = `
You are Kapi's search strategy engine for Kapruka, Sri Lanka's online gift & delivery platform.

Think: "What gift experience should I create?" before "What products should I search?"

Given shopping profile + recipient persona + gift strategy, generate HERO queries (main gifts) and SUPPORTING queries (add-ons).

Kapruka categories: gifts, flowers, cakes, electronics, fashion, lifestyle, food, beauty, books, home

RULES:
- heroQueries: exactly 3 — main meaningful gifts (jewelry, hampers, bouquets, keepsakes, premium gifts).
- supportingQueries: exactly 2 — smaller add-ons (chocolates, cards, accessories) — never duplicate hero angles.
- Hero queries are weighted higher — make them specific and emotionally aligned.
- NEVER search "mom gift", "dad gift", "boss gift" when recipient is partner.
- Keep queries 1-4 words, product-focused.
- Put budget in priceFilter only.
- Avoid greeting-card-only queries in heroQueries.

OUTPUT: Return JSON only.

SCHEMA:
{
  "heroQueries": string[],
  "supportingQueries": string[],
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

function buildFallbackStrategy(
  profile: Partial<ShoppingProfile>,
  hints: { hero: string[]; supporting: string[] },
  giftStrategyLabel: string
): SearchStrategy {
  const heroQueries = uniqueQueries(hints.hero).slice(0, 3);
  const supportingQueries = uniqueQueries(hints.supporting).slice(0, 2);
  const queries = [...heroQueries, ...supportingQueries].slice(0, MAX_SEARCH_QUERIES);

  return {
    queries,
    heroQueries,
    supportingQueries,
    categories: ["gifts", "lifestyle", "flowers"],
    priceFilter: {
      min: profile.budgetMin ?? null,
      max: profile.budgetMax ?? null,
    },
    sortBy: "relevance",
    reasoning: `Gift strategy: ${giftStrategyLabel}`,
    giftStrategy: giftStrategyLabel,
  };
}

function normalizeStrategy(
  raw: SearchStrategy & { heroQueries?: string[]; supportingQueries?: string[] },
  profile: Partial<ShoppingProfile>,
  giftStrategyLabel: string
): SearchStrategy {
  const heroQueries = uniqueQueries(raw.heroQueries ?? []).slice(0, 3);
  const supportingQueries = uniqueQueries(raw.supportingQueries ?? []).slice(0, 2);
  const queries =
    heroQueries.length + supportingQueries.length > 0
      ? [...heroQueries, ...supportingQueries].slice(0, MAX_SEARCH_QUERIES)
      : uniqueQueries(raw.queries ?? []).slice(0, MAX_SEARCH_QUERIES);

  return {
    ...raw,
    queries,
    heroQueries: heroQueries.length > 0 ? heroQueries : queries.slice(0, 3),
    supportingQueries:
      supportingQueries.length > 0 ? supportingQueries : queries.slice(3, 5),
    giftStrategy: giftStrategyLabel,
    priceFilter: raw.priceFilter ?? {
      min: profile.budgetMin ?? null,
      max: profile.budgetMax ?? null,
    },
  };
}

export async function generateSearchStrategy(
  profile: Partial<ShoppingProfile>
): Promise<SearchStrategy> {
  const persona = buildRecipientPersona(profile);
  const giftStrategy = resolveGiftStrategy(persona);
  const hints = giftStrategySearchHints(giftStrategy);

  const personaSummary = {
    recipient: persona.recipient,
    gender: persona.gender ? personaGenderLabel(persona.gender) : "unknown",
    ageGroup: persona.ageGroup ? personaAgeGroupLabel(persona.ageGroup) : "unknown",
    relationshipStrength: persona.relationshipStrength,
    searchContext: personaSearchContext(persona),
    emotionalGoal: persona.emotionalGoal,
    occasion: persona.occasion,
    confidence: persona.confidence,
  };

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nRecipient persona: ${JSON.stringify(personaSummary)}\n\nGift strategy: ${JSON.stringify(giftStrategy)}\n\nSuggested hero queries: ${JSON.stringify(hints.hero)}\nSuggested supporting: ${JSON.stringify(hints.supporting)}\n\nReturn JSON:`;
    const strategy = await generateJSON<SearchStrategy>(prompt);
    return normalizeStrategy(strategy, profile, giftStrategy.label);
  } catch {
    return buildFallbackStrategy(profile, hints, giftStrategy.label);
  }
}
