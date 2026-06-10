// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";
import { budgetOptions } from "@/lib/data";
import {
  computeProfileConfidence,
  hasBudget,
  isPreBudgetComplete,
  isReadyForRecommendations,
} from "@/lib/confidence";
import {
  buildAgeGroupQuestion,
  buildGenderQuestion,
  buildRecipientPersona,
  getAutoPersonaPatch,
  getNextPersonaQuestion,
} from "@/lib/persona/recipientPersona";

export interface PredictedAnswer {
  id: string;
  emoji?: string;
  label: string;
  value: string;
}

export interface DynamicQuestion {
  field: string;
  question: string;
  type: "pills" | "budget" | "multi";
  predictedAnswers: PredictedAnswer[];
  confidence: number;
  hint?: string;
}

export interface QuestionResponse {
  question: DynamicQuestion | null;
  confidence: number;
  ready: boolean;
  personaPatch?: Partial<ShoppingProfile>;
}

const SYSTEM_PROMPT = `
You are Kapi, an emotionally intelligent AI shopping concierge for Kapruka, Sri Lanka.

Given a partial shopping profile, determine the SINGLE most valuable missing piece of information right now.
Never ask about something already present in the profile.

IMPORTANT: NEVER ask about budget or price. Budget is always asked last by the system separately.
IMPORTANT: NEVER ask about gender or ageGroup — the persona engine handles those separately.

GIFT MODE fields (priority order — budget and persona excluded):
recipient → relationship → occasion → emotionalGoal → interests

MYSELF MODE fields (priority order — budget excluded):
category → goal → priority → urgency

RULES:
- Ask ONE warm, human question at a time. Never clinical.
- Generate 4-6 contextual predictedAnswers as clickable pills with emoji + label + value.
- ALWAYS include as the last pill: {"id":"something_else","emoji":"✨","label":"Something Else","value":"custom"}
- NEVER use field "budget" — the system handles budget as the final mandatory question.
- NEVER use fields "gender" or "ageGroup".
- predictedAnswers must be specific to the profile context — NEVER use a generic universal list.
- Use recipient persona (gender, ageGroup) when present to tailor pill suggestions.
- For boss/colleague: suggest professional, executive, travel, office-themed answers when relevant.
- For partner/mother: suggest emotional, romantic, thoughtful answers.
- For myself electronics: suggest performance, battery, value, premium answers.
- If all non-budget fields are complete, return {"ready": true} — budget will follow automatically.

OUTPUT: JSON only.

SCHEMA:
{
  "field": string,
  "question": string,
  "type": "pills" | "budget" | "multi",
  "predictedAnswers": [{"id": string, "emoji": string, "label": string, "value": string}],
  "hint": string | null
}

If ready: {"ready": true}
`;

function buildBudgetQuestion(profile: Partial<ShoppingProfile>): QuestionResponse {
  const confidence = computeProfileConfidence(profile);
  const isGift = profile.shoppingType === "gift";

  return {
    question: {
      field: "budget",
      question: isGift
        ? "What feels like the right budget for this gift?"
        : "What budget are you working with?",
      type: "budget",
      predictedAnswers: [
        ...budgetOptions.map((b) => ({
          id: b.id,
          emoji: "💰",
          label: b.label,
          value: b.id,
        })),
        { id: "no_preference", emoji: "🌿", label: "No Preference", value: "no_preference" },
        { id: "something_else", emoji: "✨", label: "Custom Range", value: "custom" },
      ],
      confidence,
      hint: "We'll only show options that fit comfortably.",
    },
    confidence,
    ready: false,
  };
}

function buildPersonaQuestion(
  field: "gender" | "ageGroup",
  profile: Partial<ShoppingProfile>
): QuestionResponse {
  const confidence = computeProfileConfidence(profile);
  const base = field === "gender" ? buildGenderQuestion() : buildAgeGroupQuestion();

  return {
    question: {
      ...base,
      confidence,
      predictedAnswers: [
        ...base.predictedAnswers,
        { id: "something_else", emoji: "✨", label: "Something Else", value: "custom" },
      ],
    },
    confidence,
    ready: false,
  };
}

function mergeProfileWithPersona(profile: Partial<ShoppingProfile>): {
  merged: Partial<ShoppingProfile>;
  personaPatch: Partial<ShoppingProfile>;
} {
  const personaPatch = getAutoPersonaPatch(profile);
  const merged = { ...profile, ...personaPatch };
  return { merged, personaPatch };
}

export async function generateNextQuestion(
  profile: Partial<ShoppingProfile>
): Promise<QuestionResponse> {
  const { merged, personaPatch } = mergeProfileWithPersona(profile);
  const confidence = computeProfileConfidence(merged);

  // Persona questions — only when materially valuable, one at a time
  const personaField = getNextPersonaQuestion(merged);
  if (personaField) {
    return {
      ...buildPersonaQuestion(personaField, merged),
      personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
    };
  }

  // Budget is mandatory last — always ask before finishing
  if (!hasBudget(merged) && isPreBudgetComplete(merged)) {
    return {
      ...buildBudgetQuestion(merged),
      personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
    };
  }

  if (isReadyForRecommendations(merged)) {
    return {
      question: null,
      confidence,
      ready: true,
      personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
    };
  }

  const persona = buildRecipientPersona(merged);
  const prompt = `${SYSTEM_PROMPT}\n\nShopping profile: ${JSON.stringify(merged)}\n\nRecipient persona: ${JSON.stringify({ gender: persona.gender, ageGroup: persona.ageGroup, personaConfidence: persona.confidence })}\n\nCurrent confidence: ${confidence}\n\nReturn JSON:`;
  const result = await generateJSON<DynamicQuestion | { ready: true }>(prompt);

  if ("ready" in result && result.ready) {
    if (!hasBudget(merged)) {
      return {
        ...buildBudgetQuestion(merged),
        personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
      };
    }
    return {
      question: null,
      confidence: computeProfileConfidence(merged),
      ready: true,
      personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
    };
  }

  const question = result as DynamicQuestion;

  if (question.field === "budget" && !hasBudget(merged)) {
    if (isPreBudgetComplete(merged)) {
      return {
        ...buildBudgetQuestion(merged),
        personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
      };
    }
  }

  if (!question.predictedAnswers?.some((a) => a.id === "something_else")) {
    question.predictedAnswers = [
      ...question.predictedAnswers,
      { id: "something_else", emoji: "✨", label: "Something Else", value: "custom" },
    ];
  }

  return {
    question: { ...question, confidence },
    confidence,
    ready: false,
    personaPatch: Object.keys(personaPatch).length > 0 ? personaPatch : undefined,
  };
}
