/**
 * Recipient Persona Engine
 *
 * Infers gender and age group from recipient context, asks only when inference
 * confidence is low, and enriches search/scoring with persona intelligence.
 */
import type { ShoppingProfile } from "@/lib/store";

export type PersonaGender = "female" | "male" | "prefer_not_to_say" | "";
export type PersonaAgeGroup = "child" | "teen" | "young_adult" | "adult" | "senior" | "";
export type RelationshipStrength = "intimate" | "family" | "professional" | "social" | "general";

export interface RecipientPersona {
  recipient: string;
  gender: PersonaGender;
  ageGroup: PersonaAgeGroup;
  relationshipStrength: RelationshipStrength;
  relationship: string;
  occasion: string;
  emotionalGoal: string;
  interests: string[];
  budget: string;
  /** Combined persona confidence 0–100. */
  confidence: number;
  genderConfidence: number;
  ageGroupConfidence: number;
  genderInferred: boolean;
  ageGroupInferred: boolean;
}

export const PERSONA_CONFIDENCE_THRESHOLD = 75;
export const AGE_ASK_THRESHOLD = 60;
const AUTO_INFER_THRESHOLD = 80;
const PERSONA_USE_THRESHOLD = 60;

const FEMALE_RECIPIENTS = new Set([
  "mother",
  "mom",
  "amma",
  "wife",
  "girlfriend",
  "sister",
  "akka",
  "daughter",
  "grandmother",
  "grandma",
  "aunt",
  "niece",
  "mother_in_law",
  "grandmother_in_law",
]);

const MALE_RECIPIENTS = new Set([
  "father",
  "dad",
  "thaththa",
  "husband",
  "boyfriend",
  "brother",
  "ayya",
  "son",
  "grandfather",
  "grandpa",
  "uncle",
  "nephew",
  "father_in_law",
  "grandfather_in_law",
]);

const AMBIGUOUS_RECIPIENTS = new Set([
  "partner",
  "boss",
  "friend",
  "cousin",
  "relative",
  "colleague",
  "teacher",
  "neighbor",
  "client",
  "mentor",
  "manager",
]);

function normalizeRecipient(profile: Partial<ShoppingProfile>): string {
  const raw = (profile.recipient || profile.recipientCustom || "").toLowerCase().trim();
  return raw.replace(/\s+/g, "_");
}

function inferRelationshipStrength(recipient: string): RelationshipStrength {
  if (["partner", "wife", "husband", "girlfriend", "boyfriend"].includes(recipient)) {
    return "intimate";
  }
  if (
    ["mother", "mom", "amma", "father", "dad", "thaththa", "son", "daughter", "sister", "brother"].includes(
      recipient
    )
  ) {
    return "family";
  }
  if (["boss", "manager", "colleague", "client", "mentor"].includes(recipient)) {
    return "professional";
  }
  if (["friend", "cousin", "neighbor"].includes(recipient)) {
    return "social";
  }
  return "general";
}

function inferGender(recipient: string): { gender: PersonaGender; confidence: number } {
  if (!recipient) return { gender: "", confidence: 0 };

  if (FEMALE_RECIPIENTS.has(recipient)) return { gender: "female", confidence: 95 };
  if (MALE_RECIPIENTS.has(recipient)) return { gender: "male", confidence: 95 };

  if (recipient.includes("mother") || recipient.includes("wife") || recipient.includes("sister")) {
    return { gender: "female", confidence: 90 };
  }
  if (recipient.includes("father") || recipient.includes("husband") || recipient.includes("brother")) {
    return { gender: "male", confidence: 90 };
  }

  if (AMBIGUOUS_RECIPIENTS.has(recipient)) return { gender: "", confidence: 20 };

  return { gender: "", confidence: 35 };
}

function inferAgeGroup(recipient: string): { ageGroup: PersonaAgeGroup; confidence: number } {
  if (!recipient) return { ageGroup: "", confidence: 0 };

  if (["grandmother", "grandma", "grandfather", "grandpa"].includes(recipient)) {
    return { ageGroup: "senior", confidence: 90 };
  }

  if (["mother", "mom", "amma", "father", "dad", "thaththa", "boss", "manager"].includes(recipient)) {
    return { ageGroup: "adult", confidence: 70 };
  }

  if (["wife", "husband", "partner", "girlfriend", "boyfriend"].includes(recipient)) {
    return { ageGroup: "young_adult", confidence: 40 };
  }

  if (["friend", "cousin", "colleague"].includes(recipient)) {
    return { ageGroup: "", confidence: 20 };
  }

  if (recipient === "daughter" || recipient === "son") {
    return { ageGroup: "teen", confidence: 55 };
  }

  if (recipient.includes("child") || recipient.includes("kid") || recipient.includes("baby")) {
    return { ageGroup: "child", confidence: 88 };
  }

  return { ageGroup: "", confidence: 30 };
}

function resolveEffectiveAgeGroup(
  explicit: PersonaAgeGroup,
  inferred: PersonaAgeGroup,
  inferConfidence: number
): PersonaAgeGroup {
  if (explicit) return explicit;
  if (inferConfidence >= PERSONA_USE_THRESHOLD && inferred) return inferred;
  return "";
}

export function buildRecipientPersona(profile: Partial<ShoppingProfile>): RecipientPersona {
  const recipient = normalizeRecipient(profile);
  const genderInfer = inferGender(recipient);
  const ageInfer = inferAgeGroup(recipient);

  const explicitGender = (profile.gender || "") as PersonaGender;
  const explicitAge = (profile.ageGroup || "") as PersonaAgeGroup;

  const gender =
    explicitGender ||
    (genderInfer.confidence >= AUTO_INFER_THRESHOLD ? genderInfer.gender : "");
  const ageGroup = resolveEffectiveAgeGroup(explicitAge, ageInfer.ageGroup, ageInfer.confidence);

  const genderConfidence = explicitGender ? 100 : genderInfer.confidence;
  const ageGroupConfidence = explicitAge ? 100 : ageInfer.confidence;

  let confidence = 40;
  if (recipient) confidence += 20;
  if (gender) confidence += Math.round(genderConfidence * 0.25);
  if (ageGroup) confidence += Math.round(ageGroupConfidence * 0.2);
  if (profile.occasion || profile.occasionCustom) confidence += 10;
  if (profile.emotionalGoal || (profile.interests?.length ?? 0) > 0) confidence += 10;

  return {
    recipient,
    gender,
    ageGroup,
    relationshipStrength: inferRelationshipStrength(recipient),
    relationship: profile.relationship || recipient,
    occasion: profile.occasion || profile.occasionCustom || "",
    emotionalGoal: profile.emotionalGoal || "",
    interests: profile.interests ?? [],
    budget: profile.budget || "",
    confidence: Math.min(100, confidence),
    genderConfidence,
    ageGroupConfidence,
    genderInferred: !explicitGender && genderInfer.confidence >= AUTO_INFER_THRESHOLD,
    ageGroupInferred: !explicitAge && ageInfer.confidence >= PERSONA_USE_THRESHOLD && Boolean(ageInfer.ageGroup),
  };
}

export function getAutoPersonaPatch(
  profile: Partial<ShoppingProfile>
): Partial<ShoppingProfile> {
  const patch: Partial<ShoppingProfile> = {};
  const recipient = normalizeRecipient(profile);
  if (!recipient) return patch;

  if (!profile.gender) {
    const { gender, confidence } = inferGender(recipient);
    if (confidence >= AUTO_INFER_THRESHOLD && gender) {
      patch.gender = gender;
    }
  }

  if (!profile.ageGroup) {
    const { ageGroup, confidence } = inferAgeGroup(recipient);
    if (confidence >= AUTO_INFER_THRESHOLD && ageGroup) {
      patch.ageGroup = ageGroup;
    }
  }

  return patch;
}

export function shouldAskGender(profile: Partial<ShoppingProfile>): boolean {
  if (profile.shoppingType !== "gift") return false;
  if (profile.gender) return false;

  const recipient = normalizeRecipient(profile);
  if (!recipient) return false;

  const { confidence } = inferGender(recipient);
  return confidence < AUTO_INFER_THRESHOLD;
}

export function shouldAskAgeGroup(profile: Partial<ShoppingProfile>): boolean {
  if (profile.shoppingType !== "gift") return false;
  if (profile.ageGroup) return false;

  const recipient = normalizeRecipient(profile);
  if (!recipient) return false;

  const { confidence } = inferAgeGroup(recipient);
  return confidence < AGE_ASK_THRESHOLD;
}

export type PersonaQuestionField = "gender" | "ageGroup";

export function getNextPersonaQuestion(
  profile: Partial<ShoppingProfile>
): PersonaQuestionField | null {
  if (shouldAskGender(profile)) return "gender";
  if (shouldAskAgeGroup(profile)) return "ageGroup";
  return null;
}

export function buildGenderQuestion() {
  return {
    field: "gender",
    question: "Tell me a little about them.",
    type: "pills" as const,
    predictedAnswers: [
      { id: "female", emoji: "👩", label: "Female", value: "female" },
      { id: "male", emoji: "👨", label: "Male", value: "male" },
      {
        id: "prefer_not",
        emoji: "🤷",
        label: "Prefer Not To Say",
        value: "prefer_not_to_say",
      },
    ],
    hint: "This helps me pick gifts that feel right for them.",
  };
}

export function buildAgeGroupQuestion() {
  return {
    field: "ageGroup",
    question: "Which age group best describes them?",
    type: "pills" as const,
    predictedAnswers: [
      { id: "child", emoji: "🧒", label: "Child", value: "child" },
      { id: "teen", emoji: "🧑", label: "Teen", value: "teen" },
      { id: "young_adult", emoji: "👨", label: "Young Adult", value: "young_adult" },
      { id: "adult", emoji: "👩", label: "Adult", value: "adult" },
      { id: "senior", emoji: "👴", label: "Senior", value: "senior" },
    ],
    hint: "Age helps me match the right style of gift.",
  };
}

export function personaSearchContext(persona: RecipientPersona): string {
  const parts: string[] = [];
  if (persona.gender && persona.gender !== "prefer_not_to_say") {
    parts.push(persona.gender === "female" ? "female" : "male");
  }
  if (persona.ageGroup) {
    parts.push(persona.ageGroup.replace(/_/g, "-"));
  }
  if (persona.recipient) parts.push(persona.recipient.replace(/_/g, " "));
  return parts.join(" ");
}

export function personaAgeGroupLabel(ageGroup: PersonaAgeGroup): string {
  const labels: Record<string, string> = {
    child: "Child (0–12)",
    teen: "Teen (13–19)",
    young_adult: "Young Adult (20–30)",
    adult: "Adult (31–50)",
    senior: "Senior (50+)",
  };
  return labels[ageGroup] ?? ageGroup;
}

export function personaGenderLabel(gender: PersonaGender): string {
  const labels: Record<string, string> = {
    female: "Female",
    male: "Male",
    prefer_not_to_say: "Prefer Not To Say",
  };
  return labels[gender] ?? gender;
}
