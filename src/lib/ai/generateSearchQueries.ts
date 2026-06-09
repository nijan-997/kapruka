// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";

export interface SearchStrategy {
  queries: string[];
  categories: string[];
  priceFilter: { min: number | null; max: number | null };
  sortBy: "relevance" | "price_asc" | "price_desc" | "popularity" | "rating";
  reasoning: string;
}

const SYSTEM_PROMPT = `
You are Kapi's search strategy engine for Kapruka, Sri Lanka's online gift & delivery platform.

Given a shopping profile, generate an optimal search strategy to find the best products.

Kapruka categories: gifts, flowers, cakes, electronics, fashion, lifestyle, food, beauty, books, home

RULES:
- Generate 8-12 diverse Kapruka search queries, from most specific to most general.
- Cover multiple angles: specific items, broader categories, recipient-type gifts, interest-based items, and occasion-appropriate options.
- Keep each query short and product-focused: 1-4 words is ideal.
- Do NOT include generic words like "Sri Lanka", "delivery", "best", "for mother", or "under 5000" in the query text.
- Put budget into priceFilter only, never into query text.
- If occasion is birthday, include cake/flower options.
- If recipient is mother, consider tea sets, sarees, jewelry, spa hampers.
- If recipient is father or boss, consider executive gifts, office gifts, business gifts, leather goods, premium pens, desk organizers.
- If interests mention travel, include travel mug, passport holder, travel accessories, travel organizer, luggage tags.
- Avoid book-related queries unless the profile explicitly wants books.
- Adjust queries based on budget tier:
  - Under Rs. 2,500: budget-friendly, practical
  - Rs. 5,000-10,000: mid-range, thoughtful
  - Rs. 20,000+: premium, luxury

OUTPUT: Return JSON only.

SCHEMA:
{
  "queries": string[],
  "categories": string[],
  "priceFilter": { "min": number | null, "max": number | null },
  "sortBy": "relevance" | "price_asc" | "price_desc" | "popularity" | "rating",
  "reasoning": string
}

EXAMPLES:

Profile: {"shoppingType":"gift","recipient":"mother","occasion":"birthday","budget":"under_5k","budgetMax":5000}
Output: {"queries":["tea gift","flowers","cake","chocolate hamper","saree"],"categories":["flowers","gifts","food"],"priceFilter":{"min":null,"max":5000},"sortBy":"relevance","reasoning":"Mother birthday gifts with emotional resonance; flowers and hampers are culturally appropriate in Sri Lanka."}

Profile: {"shoppingType":"myself","category":"electronics","budget":"under_5k","budgetMax":5000}
Output: {"queries":["electronics","bluetooth speaker","headphones","smart watch"],"categories":["electronics"],"priceFilter":{"min":null,"max":5000},"sortBy":"price_asc","reasoning":"Budget electronics; sorted by price to surface best value options."}

Profile: {"shoppingType":"gift","recipient":"partner","occasion":"anniversary","budget":"10k_20k","budgetMin":10000,"budgetMax":20000}
Output: {"queries":["rose bouquet","chocolate hamper","jewelry","spa hamper","premium gift","romantic gift","perfume gift","wine hamper","couple gift","luxury hamper"],"categories":["gifts","lifestyle","jewelry"],"priceFilter":{"min":10000,"max":20000},"sortBy":"rating","reasoning":"Anniversary gifts should feel romantic and personal; premium range allows for jewelry or experiences."}

Profile: {"shoppingType":"gift","recipient":"boss","occasion":"birthday","interests":["travel"],"budget":"under_2500","budgetMax":2500}
Output: {"queries":["travel mug","travel accessories","executive gifts","business gifts","office gifts","premium notebook","passport holder","desk organizer","corporate gifts","travel organizer","leather notebook","pen set"],"categories":["gifts","lifestyle","home"],"priceFilter":{"min":null,"max":2500},"sortBy":"relevance","reasoning":"Professional birthday gift for a travel-loving boss; diverse executive and travel queries to build a strong candidate pool."}
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

function expandQueries(profile: Partial<ShoppingProfile>, strategy: SearchStrategy): SearchStrategy {
  const extras: string[] = [];
  const recipient = (profile.recipient || profile.recipientCustom || "").toLowerCase();
  const interests = (profile.interests ?? []).join(" ").toLowerCase();

  if (["boss", "colleague", "client"].includes(recipient)) {
    extras.push(
      "executive gifts",
      "business gifts",
      "office gifts",
      "corporate gifts",
      "premium pen",
      "desk organizer"
    );
  }

  if (interests.includes("travel")) {
    extras.push(
      "travel mug",
      "travel accessories",
      "passport holder",
      "travel organizer",
      "luggage tag"
    );
  }

  if (profile.occasion === "birthday") {
    extras.push("birthday gift", "gift hamper");
  }

  const queries = uniqueQueries([...strategy.queries, ...extras]).slice(0, 12);

  while (queries.length < 8) {
    const fillers = ["gift", "premium gift", "thoughtful gift", "gift set", "hamper"];
    for (const filler of fillers) {
      if (queries.length >= 8) break;
      if (!queries.includes(filler)) queries.push(filler);
    }
    break;
  }

  return { ...strategy, queries };
}

export async function generateSearchStrategy(
  profile: Partial<ShoppingProfile>
): Promise<SearchStrategy> {
  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(profile)}\n\nReturn JSON:`;
  const strategy = await generateJSON<SearchStrategy>(prompt);
  return expandQueries(profile, strategy);
}
