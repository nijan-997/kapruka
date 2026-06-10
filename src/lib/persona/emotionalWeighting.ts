import type { GiftStrategy } from "./giftStrategyEngine";
import type { RecipientPersona } from "./recipientPersona";

export function emotionalBoostKeywords(
  persona: RecipientPersona,
  giftStrategy: GiftStrategy
): string[] {
  const goal = persona.emotionalGoal.toLowerCase();

  if (
    goal.includes("romantic") ||
    goal.includes("spark") ||
    goal.includes("love") ||
    giftStrategy.emotionalPriority === "romantic"
  ) {
    return [
      "jewelry",
      "jewellery",
      "flowers",
      "rose",
      "romantic",
      "love",
      "couple",
      "personalized",
      "photo",
      "hamper",
      "perfume",
      "keepsake",
      "anniversary",
    ];
  }

  if (
    goal.includes("respect") ||
    goal.includes("appreciat") ||
    giftStrategy.emotionalPriority === "respect"
  ) {
    return [
      "recognition",
      "plaque",
      "executive",
      "premium",
      "keepsake",
      "engraved",
      "award",
      "commemorative",
      "milestone",
      "retirement",
      "trophy",
    ];
  }

  if (goal.includes("surprise") || giftStrategy.emotionalPriority === "surprise") {
    return ["unique", "surprise", "gift box", "experience", "unexpected", "premium", "hamper"];
  }

  if (goal.includes("gratitude") || goal.includes("thank")) {
    return ["personalized", "photo", "flowers", "keepsake", "hamper", "spa", "thank"];
  }

  if (goal.includes("celebrat") || goal.includes("joy") || giftStrategy.emotionalPriority === "joy") {
    return ["celebration", "hamper", "cake", "flowers", "gift set", "premium", "party"];
  }

  if (giftStrategy.emotionalPriority === "comfort") {
    return ["spa", "wellness", "comfort", "tea", "aroma", "candle", "relax"];
  }

  return ["thoughtful", "premium", "gift", "personalized"];
}

export function emotionalPenalizeKeywords(
  persona: RecipientPersona,
  giftStrategy: GiftStrategy
): string[] {
  const penalties: string[] = [];

  if (giftStrategy.heroGiftRequired) {
    penalties.push(
      "greeting card",
      "card only",
      "keychain",
      "mini mug",
      "postcard",
      "thank you card"
    );
  }

  if (giftStrategy.emotionalPriority === "romantic") {
    penalties.push("office", "corporate", "executive desk", "for mom", "for dad", "boss");
  }

  if (giftStrategy.emotionalPriority === "respect") {
    penalties.push("novelty", "casual", "gaming", "kids", "romantic valentine");
  }

  return penalties;
}
