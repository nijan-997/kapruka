// Configurable deterministic scoring rules

import type { RecipientPersona } from "@/lib/persona/recipientPersona";

export interface ScoringRuleSet {
  boostKeywords: string[];
  penalizeKeywords: string[];
}

/** Context key: recipient|occasion or recipient|emotionalGoal */
const CONTEXT_RULES: Record<string, ScoringRuleSet> = {
  "boss|retirement": {
    boostKeywords: [
      "retirement",
      "plaque",
      "recognition",
      "executive",
      "personalized",
      "keepsake",
      "award",
      "trophy",
      "engraved",
      "commemorative",
    ],
    penalizeKeywords: ["birthday", "novelty", "casual", "romantic", "valentine", "kids", "children"],
  },
  "boss|birthday": {
    boostKeywords: [
      "executive",
      "office",
      "business",
      "corporate",
      "leather",
      "pen",
      "notebook",
      "desk",
      "travel mug",
      "passport",
      "organizer",
      "premium",
    ],
    penalizeKeywords: ["romantic", "valentine", "kids", "children", "novelty", "school"],
  },
  "boss|": {
    boostKeywords: ["executive", "office", "business", "corporate", "professional", "leather", "premium"],
    penalizeKeywords: ["romantic", "kids", "children", "novelty", "casual"],
  },
  "mother|birthday": {
    boostKeywords: ["flowers", "hamper", "spa", "tea", "saree", "chocolate", "cake", "jewelry"],
    penalizeKeywords: ["office", "corporate", "executive", "gadget", "tools"],
  },
  "partner|anniversary": {
    boostKeywords: ["romantic", "rose", "jewelry", "perfume", "spa", "chocolate", "wine", "couple"],
    penalizeKeywords: ["office", "corporate", "school", "children"],
  },
  "partner|": {
    boostKeywords: ["romantic", "personal", "jewelry", "flowers", "spa", "chocolate"],
    penalizeKeywords: ["office", "corporate", "school", "children"],
  },
};

const INTEREST_BOOSTS: Record<string, string[]> = {
  travel: ["travel", "passport", "luggage", "mug", "organizer", "accessories", "bag"],
  gardening: ["garden", "plant", "flower", "outdoor", "pot"],
  cooking: ["kitchen", "cook", "food", "hamper", "spice", "bake"],
  technology: ["electronics", "gadget", "speaker", "headphone", "smart", "tech"],
  wellness: ["spa", "aroma", "candle", "wellness", "relax", "bath"],
  coffee: ["coffee", "tea", "mug", "brew"],
};

const OCCASION_BOOSTS: Record<string, string[]> = {
  birthday: ["birthday", "cake", "celebration", "party", "gift"],
  anniversary: ["anniversary", "romantic", "rose", "couple"],
  graduation: ["graduation", "achievement", "success", "congratulations"],
  wedding: ["wedding", "bridal", "couple", "celebration"],
  retirement: ["retirement", "recognition", "plaque", "commemorative"],
  thank_you: ["thank", "gratitude", "appreciation", "hamper"],
};

/** Persona + emotion combinations for fine-grained gift matching. */
export function resolvePersonaEmotionalRules(
  persona: RecipientPersona,
  occasion: string,
  emotionalGoal: string
): ScoringRuleSet | null {
  const o = occasion.toLowerCase();
  const goal = emotionalGoal.toLowerCase();
  const isBoss = persona.recipient === "boss";

  if (
    isBoss &&
    persona.gender === "male" &&
    persona.ageGroup === "senior" &&
    (o === "retirement" || goal.includes("respect"))
  ) {
    return {
      boostKeywords: [
        "retirement",
        "plaque",
        "recognition",
        "keepsake",
        "commemorative",
        "executive",
        "engraved",
        "award",
      ],
      penalizeKeywords: ["birthday", "novelty", "casual", "romantic", "gaming", "teen"],
    };
  }

  if (
    isBoss &&
    persona.gender === "female" &&
    persona.ageGroup === "young_adult" &&
    (o === "promotion" || goal.includes("celebrat") || goal.includes("success"))
  ) {
    return {
      boostKeywords: [
        "premium",
        "executive",
        "professional",
        "celebration",
        "success",
        "jewelry",
        "personalized",
        "leather",
      ],
      penalizeKeywords: ["retirement", "senior", "kids", "novelty", "casual"],
    };
  }

  if (persona.gender === "female" && persona.ageGroup === "young_adult" && o === "anniversary") {
    return {
      boostKeywords: ["jewelry", "flowers", "perfume", "spa", "romantic", "personalized", "chocolate"],
      penalizeKeywords: ["office", "corporate", "tools", "gaming"],
    };
  }

  if (persona.gender === "male" && persona.ageGroup === "young_adult" && o === "anniversary") {
    return {
      boostKeywords: ["watch", "tech", "experience", "gourmet", "wine", "accessories", "personalized"],
      penalizeKeywords: ["saree", "spa", "bridal", "cosmetic"],
    };
  }

  return null;
}

export function resolveScoringRules(
  recipient: string,
  occasion: string,
  emotionalGoal: string
): ScoringRuleSet {
  const r = recipient.toLowerCase();
  const o = occasion.toLowerCase();
  const key = `${r}|${o}`;
  if (CONTEXT_RULES[key]) return CONTEXT_RULES[key];
  if (CONTEXT_RULES[`${r}|`]) return CONTEXT_RULES[`${r}|`];

  const goal = emotionalGoal.toLowerCase();
  if (goal.includes("respect") || goal.includes("appreciat")) {
    return {
      boostKeywords: ["premium", "executive", "recognition", "personalized", "thoughtful"],
      penalizeKeywords: ["novelty", "casual", "kids", "children"],
    };
  }

  return { boostKeywords: ["gift", "premium", "thoughtful"], penalizeKeywords: ["school", "children", "textbook"] };
}

export function interestBoostKeywords(interests: string[]): string[] {
  const keywords: string[] = [];
  const joined = interests.join(" ").toLowerCase();
  for (const [interest, words] of Object.entries(INTEREST_BOOSTS)) {
    if (joined.includes(interest)) keywords.push(...words);
  }
  return keywords;
}

export function occasionBoostKeywords(occasion: string): string[] {
  return OCCASION_BOOSTS[occasion.toLowerCase()] ?? [];
}
