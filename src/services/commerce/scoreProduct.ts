import type { ProductInput } from "@/lib/ai/rankRecommendations";
import type { ShoppingProfile } from "@/lib/store";
import { emotionalBoostKeywords, emotionalPenalizeKeywords } from "@/lib/persona/emotionalWeighting";
import { resolveGiftStrategy, type GiftStrategy } from "@/lib/persona/giftStrategyEngine";
import { classifyGiftType, heroGiftBoost } from "@/lib/persona/heroGiftClassifier";
import { buildRecipientPersona } from "@/lib/persona/recipientPersona";
import {
  personaBoostKeywords,
  personaPenalizeKeywords,
} from "@/lib/persona/personaScoring";
import {
  interestBoostKeywords,
  occasionBoostKeywords,
  resolvePersonaEmotionalRules,
  resolveScoringRules,
} from "./scoringRules";
import { MIN_DETERMINISTIC_SCORE } from "./retrievalConfig";
import { giftStrategyMatchKeywords } from "@/lib/persona/giftStrategyScoring";

export interface ProductScore {
  productId: string;
  score: number;
  giftType: "HERO" | "SUPPORTING";
  breakdown: {
    recipient: number;
    gender: number;
    ageGroup: number;
    occasion: number;
    emotionalGoal: number;
    giftStrategy: number;
    heroGift: number;
    budget: number;
    delivery: number;
    personalization: number;
    interest: number;
  };
  accepted: boolean;
}

function haystack(product: ProductInput): string {
  return [product.name, product.category, product.description ?? "", product.summary ?? "", ...product.tags]
    .join(" ")
    .toLowerCase();
}

function keywordHits(text: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (kw.length > 2 && text.includes(kw.toLowerCase())) hits++;
  }
  return hits;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function scoreDimension(
  base: number,
  text: string,
  boosts: string[],
  penalties: string[],
  max: number
): number {
  let score = base;
  score += Math.min(max * 0.6, keywordHits(text, boosts) * 3);
  score -= Math.min(max * 0.5, keywordHits(text, penalties) * 3);
  return clamp(score, 0, max);
}

export function scoreProduct(
  product: ProductInput,
  profile: Partial<ShoppingProfile>,
  giftStrategy?: GiftStrategy
): ProductScore {
  const text = haystack(product);
  const recipient = (profile.recipient || profile.recipientCustom || "").toLowerCase();
  const occasion = (profile.occasion || profile.occasionCustom || "").toLowerCase();
  const emotionalGoal = (profile.emotionalGoal || "").toLowerCase();
  const interests = profile.interests ?? [];
  const persona = buildRecipientPersona(profile);
  const strategy = giftStrategy ?? resolveGiftStrategy(persona);
  const personaRules = resolvePersonaEmotionalRules(persona, occasion, emotionalGoal);
  const rules = personaRules ?? resolveScoringRules(recipient, occasion, emotionalGoal);
  const personaBoosts = personaBoostKeywords(persona);
  const personaPenalties = personaPenalizeKeywords(persona);
  const emotionalBoosts = emotionalBoostKeywords(persona, strategy);
  const emotionalPenalties = emotionalPenalizeKeywords(persona, strategy);
  const strategyKeywords = giftStrategyMatchKeywords(strategy);
  const giftType = classifyGiftType(product);

  const recipientKeywords: Record<string, string[]> = {
    boss: ["executive", "office", "business", "corporate", "professional"],
    colleague: ["office", "business", "professional", "corporate"],
    mother: ["mother", "mom", "floral", "tea", "spa", "elegant"],
    father: ["father", "dad", "gadget", "leather", "grooming"],
    partner: ["romantic", "couple", "love", "personal"],
    friend: ["fun", "casual", "thoughtful", "gift"],
  };

  const recipientScore = scoreDimension(
    10,
    text,
    recipient ? recipientKeywords[recipient] ?? rules.boostKeywords : rules.boostKeywords,
    rules.penalizeKeywords,
    20
  );

  const genderScore = scoreDimension(
    persona.gender && persona.gender !== "prefer_not_to_say" ? 6 : 4,
    text,
    personaBoosts,
    personaPenalties,
    10
  );

  const ageGroupScore = scoreDimension(
    persona.ageGroup ? 6 : 4,
    text,
    personaBoosts,
    personaPenalties,
    10
  );

  const occasionScore = scoreDimension(6, text, occasionBoostKeywords(occasion), [], 15);

  const emotionalScore = scoreDimension(
    emotionalGoal ? 8 : 5,
    text,
    [...emotionalBoosts, ...rules.boostKeywords],
    emotionalPenalties,
    20
  );

  const giftStrategyScore = scoreDimension(6, text, strategyKeywords.boost, strategyKeywords.penalize, 20);

  let heroGiftScore = 4;
  if (strategy.heroGiftRequired) {
    heroGiftScore = giftType === "HERO" ? 20 : 3;
    if (giftType === "SUPPORTING" && /greeting card|card only|keychain/i.test(text)) {
      heroGiftScore = 1;
    }
  } else {
    heroGiftScore = clamp(heroGiftBoost(product) * 0.6, 0, 20);
  }

  let budgetScore = 8;
  const max = profile.budgetMax;
  if (max != null && max > 0) {
    if (product.price <= max) {
      const ratio = product.price / max;
      budgetScore = ratio < 0.7 ? 10 : ratio < 0.9 ? 9 : 7;
    } else if (product.price <= max * 1.1) {
      budgetScore = 5;
    } else {
      budgetScore = 2;
    }
  }

  let deliveryScore = 5;
  if (product.inStock || product.availableToday) deliveryScore += 3;
  if (product.availableTomorrow) deliveryScore += 2;
  deliveryScore = clamp(deliveryScore, 0, 8);

  let personalization = 4;
  if (/personal|custom|engrav|monogram|name/i.test(text)) personalization += 4;
  if (product.rating && product.rating >= 4.5) personalization += 2;
  personalization = clamp(personalization, 0, 8);

  let interestScore = 4;
  interestScore += Math.min(4, keywordHits(text, interestBoostKeywords(interests)) * 2);
  interestScore = clamp(interestScore, 0, 8);

  const total = clamp(
    recipientScore +
      genderScore +
      ageGroupScore +
      occasionScore +
      emotionalScore +
      giftStrategyScore +
      heroGiftScore +
      budgetScore +
      deliveryScore +
      personalization +
      interestScore
  );

  const rejectSupportingOnly =
    strategy.heroGiftRequired &&
    giftType === "SUPPORTING" &&
    /greeting card|card only|keychain|postcard|thank you card/i.test(text);

  return {
    productId: product.id,
    score: total,
    giftType,
    breakdown: {
      recipient: recipientScore,
      gender: genderScore,
      ageGroup: ageGroupScore,
      occasion: occasionScore,
      emotionalGoal: emotionalScore,
      giftStrategy: giftStrategyScore,
      heroGift: heroGiftScore,
      budget: budgetScore,
      delivery: deliveryScore,
      personalization,
      interest: interestScore,
    },
    accepted: !rejectSupportingOnly && total >= MIN_DETERMINISTIC_SCORE,
  };
}

export function scoreProducts(
  products: ProductInput[],
  profile: Partial<ShoppingProfile>,
  giftStrategy?: GiftStrategy
): ProductScore[] {
  const strategy = giftStrategy ?? resolveGiftStrategy(buildRecipientPersona(profile));
  return products
    .map((p) => scoreProduct(p, profile, strategy))
    .sort((a, b) => b.score - a.score);
}
