import type { RecipientPersona } from "./recipientPersona";

export type GiftStrategyType =
  | "romantic-memory"
  | "surprise-moment"
  | "gratitude"
  | "legacy-respect"
  | "celebration"
  | "achievement"
  | "comfort-care"
  | "practical-value"
  | "luxury-experience";

export type EmotionalPriority = "romantic" | "respect" | "joy" | "comfort" | "practical" | "surprise";

export interface GiftStrategy {
  strategy: GiftStrategyType;
  heroGiftRequired: boolean;
  supportingGiftAllowed: boolean;
  emotionalPriority: EmotionalPriority;
  label: string;
}

function normalizeGoal(goal: string): string {
  return goal.toLowerCase().trim();
}

function normalizeOccasion(occasion: string): string {
  return occasion.toLowerCase().trim().replace(/\s+/g, "_");
}

export function resolveGiftStrategy(persona: RecipientPersona): GiftStrategy {
  const goal = normalizeGoal(persona.emotionalGoal);
  const occasion = normalizeOccasion(persona.occasion);
  const recipient = persona.recipient;

  if (
    (recipient === "partner" || recipient === "wife" || recipient === "girlfriend" || recipient === "husband" || recipient === "boyfriend") &&
    (goal.includes("romantic") || goal.includes("love") || goal.includes("spark") || occasion === "anniversary" || occasion === "valentine")
  ) {
    return {
      strategy: "romantic-memory",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "romantic",
      label: "Romantic Memory",
    };
  }

  if (
    recipient === "boss" &&
    (occasion === "retirement" || goal.includes("respect") || goal.includes("appreciat"))
  ) {
    return {
      strategy: "legacy-respect",
      heroGiftRequired: true,
      supportingGiftAllowed: false,
      emotionalPriority: "respect",
      label: "Legacy & Respect",
    };
  }

  if (
    (recipient === "mother" || recipient === "mom" || recipient === "amma") &&
    (occasion === "thank_you" || goal.includes("gratitude") || goal.includes("thank"))
  ) {
    return {
      strategy: "gratitude",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "respect",
      label: "Gratitude",
    };
  }

  if (goal.includes("surprise") || goal.includes("unexpected")) {
    return {
      strategy: "surprise-moment",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "surprise",
      label: "Surprise Moment",
    };
  }

  if (occasion === "promotion" || goal.includes("success") || goal.includes("achiev") || goal.includes("celebrat")) {
    return {
      strategy: "achievement",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "joy",
      label: "Achievement",
    };
  }

  if (occasion === "birthday" || occasion === "anniversary" || occasion === "wedding") {
    return {
      strategy: "celebration",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "joy",
      label: "Celebration",
    };
  }

  if (goal.includes("comfort") || goal.includes("care") || goal.includes("wellness")) {
    return {
      strategy: "comfort-care",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "comfort",
      label: "Comfort & Care",
    };
  }

  if (goal.includes("practical") || goal.includes("useful") || goal.includes("value")) {
    return {
      strategy: "practical-value",
      heroGiftRequired: false,
      supportingGiftAllowed: true,
      emotionalPriority: "practical",
      label: "Practical Value",
    };
  }

  if (goal.includes("luxury") || goal.includes("premium") || goal.includes("special")) {
    return {
      strategy: "luxury-experience",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "joy",
      label: "Luxury Experience",
    };
  }

  if (goal.includes("respect") || goal.includes("appreciat")) {
    return {
      strategy: "legacy-respect",
      heroGiftRequired: true,
      supportingGiftAllowed: false,
      emotionalPriority: "respect",
      label: "Legacy & Respect",
    };
  }

  if (recipient === "partner" && occasion === "birthday") {
    return {
      strategy: "romantic-memory",
      heroGiftRequired: true,
      supportingGiftAllowed: true,
      emotionalPriority: "romantic",
      label: "Romantic Memory",
    };
  }

  return {
    strategy: "celebration",
    heroGiftRequired: true,
    supportingGiftAllowed: true,
    emotionalPriority: "joy",
    label: "Celebration",
  };
}

export function giftStrategySearchHints(strategy: GiftStrategy): {
  hero: string[];
  supporting: string[];
} {
  switch (strategy.strategy) {
    case "romantic-memory":
      return {
        hero: [
          "romantic jewelry",
          "romantic keepsake",
          "personalized romantic gift",
          "premium romantic gift",
          "couple gift",
        ],
        supporting: ["romantic chocolates", "birthday greeting card", "small romantic accessories"],
      };
    case "legacy-respect":
      return {
        hero: ["recognition plaque", "executive gift", "premium keepsake", "retirement gift", "engraved award"],
        supporting: ["thank you card", "premium pen"],
      };
    case "gratitude":
      return {
        hero: ["personalized gift", "flower bouquet", "spa hamper", "photo gift", "keepsake"],
        supporting: ["thank you card", "chocolates"],
      };
    case "surprise-moment":
      return {
        hero: ["unique gift box", "surprise gift", "experience gift", "premium hamper"],
        supporting: ["greeting card", "chocolates"],
      };
    case "achievement":
      return {
        hero: ["premium gift", "executive gift", "celebration hamper", "personalized award"],
        supporting: ["congratulations card", "chocolates"],
      };
    case "comfort-care":
      return {
        hero: ["spa hamper", "wellness gift", "comfort gift set", "tea hamper"],
        supporting: ["greeting card", "chocolates"],
      };
    case "practical-value":
      return {
        hero: ["practical gift", "useful gift set", "premium accessory"],
        supporting: ["gift card", "small accessory"],
      };
    case "luxury-experience":
      return {
        hero: ["luxury hamper", "premium gift", "experience gift", "designer accessory"],
        supporting: ["premium chocolates", "greeting card"],
      };
    default:
      return {
        hero: ["gift hamper", "premium gift", "personalized gift"],
        supporting: ["greeting card", "chocolates"],
      };
  }
}
