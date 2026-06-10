import type { ShoppingProfile } from "@/lib/store";
import { budgetOptions } from "@/lib/data";
import { getAutoPersonaPatch } from "@/lib/persona/recipientPersona";

export interface PillAnswer {
  id: string;
  label: string;
  value: string;
  emoji?: string;
}

/** Apply a pill answer locally — no AI call. */
export function applyPillAnswer(
  profile: Partial<ShoppingProfile>,
  field: string,
  answer: PillAnswer
): Partial<ShoppingProfile> {
  const patch: Partial<ShoppingProfile> = {};

  switch (field) {
    case "recipient":
      patch.recipient = answer.value;
      patch.relationship = answer.value;
      if (answer.value === "custom") patch.recipientCustom = answer.label;
      Object.assign(patch, getAutoPersonaPatch({ ...profile, ...patch }));
      break;
    case "gender":
      patch.gender = answer.value;
      break;
    case "ageGroup":
      patch.ageGroup = answer.value;
      break;
    case "relationship":
      patch.relationship = answer.value;
      break;
    case "occasion":
      patch.occasion = answer.value;
      if (answer.value === "other") patch.occasionCustom = answer.label;
      break;
    case "emotionalGoal":
      patch.emotionalGoal = answer.label;
      break;
    case "interests":
      patch.interests = [...(profile.interests ?? []), answer.label].filter(
        (v, i, a) => a.indexOf(v) === i
      );
      break;
    case "category":
      patch.category = answer.value;
      break;
    case "goal":
      patch.goal = answer.label;
      break;
    case "priority":
      patch.priority = answer.label;
      break;
    case "urgency":
      patch.urgency = answer.label;
      patch.deliveryDate = answer.value;
      break;
    case "budget": {
      const preset = budgetOptions.find((b) => b.id === answer.value);
      if (preset) {
        patch.budget = preset.id;
        patch.budgetMin = preset.min;
        patch.budgetMax = preset.max;
      } else if (answer.value === "no_preference") {
        patch.budget = "no_preference";
        patch.budgetMin = null;
        patch.budgetMax = null;
      } else if (answer.value === "custom") {
        patch.budget = "custom";
      }
      break;
    }
    default:
      patch.customAnswers = [
        ...(profile.customAnswers ?? []),
        { field, label: answer.label, value: answer.value },
      ];
  }

  return patch;
}

export function applyBudgetRange(
  profile: Partial<ShoppingProfile>,
  min: number,
  max: number
): Partial<ShoppingProfile> {
  return {
    budget: "custom",
    budgetMin: min,
    budgetMax: max,
  };
}
