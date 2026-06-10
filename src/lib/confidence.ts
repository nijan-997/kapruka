import type { ShoppingProfile } from "@/lib/store";
import {
  buildRecipientPersona,
  getNextPersonaQuestion,
  PERSONA_CONFIDENCE_THRESHOLD,
} from "@/lib/persona/recipientPersona";

export const CONFIDENCE_THRESHOLD = 80;

function has(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function hasInterests(profile: Partial<ShoppingProfile>): boolean {
  return (profile.interests?.length ?? 0) > 0 || has(profile.emotionalGoal);
}

/** Budget is set — required before recommendations. */
export function hasBudget(profile: Partial<ShoppingProfile>): boolean {
  if (profile.budget === "no_preference") return true;
  if (profile.budget === "custom" && profile.budgetMax != null) return true;
  if (profile.budget && profile.budget !== "custom" && profile.budgetMax != null) return true;
  if (profile.budgetMax != null && profile.budgetMax > 0) return true;
  return false;
}

/** Non-budget essentials are filled — next step must be budget. */
export function isPreBudgetComplete(profile: Partial<ShoppingProfile>): boolean {
  if (hasBudget(profile)) return false;

  const type = profile.shoppingType;

  if (type === "gift") {
    const hasRecipient = has(profile.recipient) || has(profile.recipientCustom);
    const hasOccasion = has(profile.occasion) || has(profile.occasionCustom);
    const hasPersonalization = has(profile.emotionalGoal) || hasInterests(profile);
    const personaComplete =
      !hasRecipient || getNextPersonaQuestion(profile) === null;
    return hasRecipient && hasOccasion && hasPersonalization && personaComplete;
  }

  if (type === "myself") {
    return has(profile.category) && (has(profile.goal) || has(profile.priority));
  }

  // NL search — enough context to ask budget
  const hasWhoOrWhat = has(profile.recipient) || has(profile.category) || has(profile.naturalLanguageQuery);
  const hasWhy = has(profile.occasion) || has(profile.goal) || hasInterests(profile) || has(profile.priority);
  return hasWhoOrWhat && hasWhy;
}

function computeRawConfidence(profile: Partial<ShoppingProfile>): number {
  const type = profile.shoppingType;

  if (type === "gift") {
    let score = 0;
    if (has(profile.recipient) || has(profile.recipientCustom)) score += 18;
    if (has(profile.relationship)) score += 6;
    if (has(profile.gender)) score += 8;
    if (has(profile.ageGroup)) score += 8;
    if (has(profile.occasion) || has(profile.occasionCustom)) score += 16;
    if (has(profile.emotionalGoal)) score += 16;
    if (hasInterests(profile)) score += 12;
    if (hasBudget(profile)) score += 16;
    const persona = buildRecipientPersona(profile);
    if (persona.confidence >= PERSONA_CONFIDENCE_THRESHOLD) score += 6;
    return Math.min(100, score);
  }

  if (type === "myself") {
    let score = 0;
    if (has(profile.category)) score += 25;
    if (has(profile.goal)) score += 25;
    if (has(profile.priority)) score += 20;
    if (hasBudget(profile)) score += 20;
    if (has(profile.urgency)) score += 10;
    return Math.min(100, score);
  }

  let score = 0;
  if (has(profile.naturalLanguageQuery)) score += 15;
  if (has(profile.recipient) || has(profile.category)) score += 20;
  if (has(profile.occasion) || has(profile.goal)) score += 15;
  if (hasInterests(profile) || has(profile.priority)) score += 15;
  if (hasBudget(profile)) score += 25;
  if (has(profile.emotionalGoal)) score += 10;
  return Math.min(100, score);
}

/** Local confidence engine — capped below threshold until budget is set. */
export function computeProfileConfidence(profile: Partial<ShoppingProfile>): number {
  const score = computeRawConfidence(profile);
  if (!hasBudget(profile)) {
    return Math.min(score, CONFIDENCE_THRESHOLD - 1);
  }
  return score;
}

export function isReadyForRecommendations(profile: Partial<ShoppingProfile>): boolean {
  return hasBudget(profile) && computeRawConfidence(profile) >= CONFIDENCE_THRESHOLD;
}

export function progressLabel(profile: Partial<ShoppingProfile>, questionCount: number): string {
  if (!hasBudget(profile) && isPreBudgetComplete(profile)) {
    return "Almost there...";
  }
  const confidence = computeProfileConfidence(profile);
  if (confidence >= CONFIDENCE_THRESHOLD && hasBudget(profile)) {
    return "Finding the best match...";
  }
  if (questionCount <= 1) {
    return profile.shoppingType === "gift" ? "Understanding the recipient..." : "Understanding you...";
  }
  if (questionCount <= 3) return "Understanding what matters...";
  return "Almost there...";
}
