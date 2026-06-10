// server-side only
import { generateJSON } from "./openRouter";
import type { ShoppingProfile } from "@/lib/store";

export interface ExtractedIntent {
  shoppingType: "gift" | "myself" | "inspire" | "search" | "";
  recipient: string;
  occasion: string;
  budget: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deliveryDate: string;
  interests: string[];
  category: string;
  language: "english" | "sinhala" | "tanglish" | "mixed";
  missingInformation: string[];
  confidence: number;
}

const SYSTEM_PROMPT = `
You are an AI assistant for Kapi, a personal shopping concierge for Kapruka — Sri Lanka's leading online gift and delivery platform.

Your job: Extract structured shopping intent from user messages.
Users may write in English, Sinhala, Tanglish (Tamil-English mix), or a mix of Sinhala and English.

SINHALA GLOSSARY (common words):
- amma / අම්මා = mother
- thaththha / ත‍ාත්තා = father  
- mage = my
- ta / ට = for/to
- gift ekak = a gift
- one / ඕන = want/need
- birthday = birthday
- apita = for us
- hoyanawa = looking for
- kiyala = saying

OUTPUT: Return valid JSON only. No markdown, no explanation.

SCHEMA:
{
  "shoppingType": "gift" | "myself" | "inspire" | "search" | "",
  "recipient": "mother" | "father" | "partner" | "friend" | "child" | "colleague" | "client" | "teacher" | string | "",
  "occasion": "birthday" | "anniversary" | "graduation" | "wedding" | "housewarming" | "thank_you" | "just_because" | "festival" | string | "",
  "budget": number | null,
  "budgetMin": number | null,
  "budgetMax": number | null,
  "deliveryDate": "today" | "tomorrow" | "this_week" | string | "",
  "interests": string[],
  "category": "electronics" | "flowers" | "cakes" | "fashion" | "lifestyle" | "home" | "food" | "beauty" | string | "",
  "language": "english" | "sinhala" | "tanglish" | "mixed",
  "missingInformation": string[],
  "confidence": number (0-1)
}

missingInformation should list ONLY the fields that are genuinely needed but not present.
For "gift" shoppingType, required fields: recipient, occasion, budget.
For "myself" or "search", required fields: category or budget.

EXAMPLES:

Input: "mage amma ta birthday gift ekak one under 5000"
Output: {"shoppingType":"gift","recipient":"mother","occasion":"birthday","budget":5000,"budgetMin":null,"budgetMax":5000,"deliveryDate":"","interests":[],"category":"","language":"tanglish","missingInformation":["deliveryDate"],"confidence":0.95}

Input: "Need a laptop under 250000"
Output: {"shoppingType":"myself","recipient":"","occasion":"","budget":250000,"budgetMin":null,"budgetMax":250000,"deliveryDate":"","interests":[],"category":"electronics","language":"english","missingInformation":[],"confidence":0.97}

Input: "flowers for tomorrow"
Output: {"shoppingType":"myself","recipient":"","occasion":"","budget":null,"budgetMin":null,"budgetMax":null,"deliveryDate":"tomorrow","interests":[],"category":"flowers","language":"english","missingInformation":["budget"],"confidence":0.88}

Input: "මගේ අම්මාට තෑග්ගක් ඕන"
Output: {"shoppingType":"gift","recipient":"mother","occasion":"","budget":null,"budgetMin":null,"budgetMax":null,"deliveryDate":"","interests":[],"category":"","language":"sinhala","missingInformation":["occasion","budget"],"confidence":0.9}
`;

export async function extractIntent(message: string): Promise<ExtractedIntent> {
  const prompt = `${SYSTEM_PROMPT}\n\nUser message: "${message}"\n\nReturn JSON:`;
  return generateJSON<ExtractedIntent>(prompt);
}

export function intentToProfile(intent: ExtractedIntent): Partial<ShoppingProfile> {
  const shoppingType =
    intent.shoppingType === "inspire" ? "gift" : intent.shoppingType || "";

  return {
    shoppingType,
    recipient: intent.recipient || "",
    relationship: intent.recipient || "",
    occasion: intent.occasion || "",
    emotionalGoal: intent.interests?.[0] ?? "",
    budget: intent.budget ? String(intent.budget) : "",
    budgetMin: intent.budgetMin,
    budgetMax: intent.budgetMax,
    deliveryDate: intent.deliveryDate || "",
    urgency: intent.deliveryDate || "",
    interests: intent.interests || [],
    category: intent.category || "",
    goal: intent.category || "",
    language: intent.language || "english",
  };
}
