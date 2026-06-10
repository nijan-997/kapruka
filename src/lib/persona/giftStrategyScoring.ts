import type { GiftStrategy } from "./giftStrategyEngine";

export function giftStrategyMatchKeywords(strategy: GiftStrategy): {
  boost: string[];
  penalize: string[];
} {
  switch (strategy.strategy) {
    case "romantic-memory":
      return {
        boost: ["romantic", "jewelry", "flowers", "couple", "love", "personalized", "keepsake", "hamper"],
        penalize: ["for mom", "for dad", "boss", "office", "greeting card only"],
      };
    case "legacy-respect":
      return {
        boost: ["plaque", "recognition", "executive", "retirement", "keepsake", "award", "engraved"],
        penalize: ["romantic", "kids", "novelty", "gaming", "greeting card"],
      };
    case "gratitude":
      return {
        boost: ["personalized", "flowers", "spa", "hamper", "photo", "keepsake", "thank"],
        penalize: ["romantic valentine", "gaming", "boss"],
      };
    case "surprise-moment":
      return {
        boost: ["unique", "surprise", "gift box", "experience", "premium"],
        penalize: ["utility", "grocery", "basic card"],
      };
    case "achievement":
      return {
        boost: ["premium", "celebration", "executive", "award", "success", "congratulations"],
        penalize: ["kids", "romantic valentine"],
      };
    case "comfort-care":
      return {
        boost: ["spa", "wellness", "tea", "comfort", "aroma", "hamper"],
        penalize: ["gaming", "tools"],
      };
    case "practical-value":
      return {
        boost: ["practical", "useful", "organizer", "accessory", "premium"],
        penalize: ["greeting card only", "novelty"],
      };
    case "luxury-experience":
      return {
        boost: ["luxury", "premium", "hamper", "experience", "designer"],
        penalize: ["cheap", "basic card", "keychain"],
      };
    default:
      return {
        boost: ["gift", "hamper", "premium", "thoughtful"],
        penalize: ["greeting card only"],
      };
  }
}
