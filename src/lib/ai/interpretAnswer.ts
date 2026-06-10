// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";

export interface InterpretedAnswer {
  label: string;
  value: string;
  emoji?: string;
  profilePatch: Partial<ShoppingProfile>;
}

const SYSTEM_PROMPT = `
You interpret free-text or voice answers for Kapi, Kapruka's AI shopping concierge.

Given a shopping profile, the field being asked about, and the user's raw answer (English, Sinhala, Tanglish, or mixed), return:
1. A short contextual pill label with emoji (e.g. "🎉 Promotion", "✈️ Loves Travel")
2. Structured profile fields to update

OUTPUT: JSON only.

SCHEMA:
{
  "label": string,
  "value": string,
  "emoji": string,
  "profilePatch": {
    // only fields relevant to the question
    "recipient"?: string,
    "recipientCustom"?: string,
    "relationship"?: string,
    "occasion"?: string,
    "occasionCustom"?: string,
    "emotionalGoal"?: string,
    "interests"?: string[],
    "category"?: string,
    "goal"?: string,
    "priority"?: string,
    "urgency"?: string,
    "budget"?: string,
    "budgetMin"?: number | null,
    "budgetMax"?: number | null,
    "gender"?: string,
    "ageGroup"?: string
  }
}
`;

export async function interpretAnswer(
  profile: Partial<ShoppingProfile>,
  field: string,
  rawAnswer: string
): Promise<InterpretedAnswer> {
  const prompt = `${SYSTEM_PROMPT}\n\nProfile: ${JSON.stringify(profile)}\nField: ${field}\nUser answer: "${rawAnswer}"\n\nReturn JSON:`;
  const result = await generateJSON<InterpretedAnswer>(prompt);

  return {
    ...result,
    profilePatch: {
      ...result.profilePatch,
      customAnswers: [
        ...(profile.customAnswers ?? []),
        { field, label: result.label, value: rawAnswer },
      ],
    },
  };
}
