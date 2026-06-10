import type { ProductInput } from "@/lib/ai/rankRecommendations";
import type { ShoppingProfile } from "@/lib/store";
import type { FilterRejection } from "@/services/commerce/productFilters";

const RECIPIENT_EXCLUSIONS: Record<string, string[]> = {
  partner: [
    "mom",
    "mother",
    "amma",
    "dad",
    "father",
    "thaththa",
    "boss",
    "manager",
    "teacher",
    "grandma",
    "grandmother",
    "grandfather",
    "grandpa",
    "for mom",
    "for dad",
    "mothers day",
    "fathers day",
  ],
  wife: [
    "dad",
    "father",
    "boss",
    "mom",
    "mother",
    "boyfriend",
    "for dad",
    "for mom",
  ],
  husband: [
    "mom",
    "mother",
    "wife",
    "girlfriend",
    "boss",
    "for mom",
    "romantic card for her",
  ],
  girlfriend: ["dad", "father", "boss", "mom", "mother", "for dad", "for mom"],
  boyfriend: ["mom", "mother", "wife", "girlfriend", "for mom"],
  mother: [
    "dad",
    "father",
    "thaththa",
    "boss",
    "partner",
    "wife",
    "girlfriend",
    "boyfriend",
    "for dad",
    "for father",
    "fathers day",
  ],
  father: [
    "mom",
    "mother",
    "amma",
    "wife",
    "girlfriend",
    "partner",
    "for mom",
    "for mother",
    "mothers day",
  ],
  boss: [
    "mom",
    "mother",
    "amma",
    "dad",
    "father",
    "wife",
    "girlfriend",
    "boyfriend",
    "romantic",
    "valentine",
    "for mom",
    "for dad",
    "love you",
  ],
  colleague: ["romantic", "valentine", "wife", "girlfriend", "boyfriend", "for mom", "for dad"],
  friend: ["romantic valentine", "for wife", "for husband"],
};

function normalizeRecipient(profile: Partial<ShoppingProfile>): string {
  return (profile.recipient || profile.recipientCustom || "").toLowerCase().trim().replace(/\s+/g, "_");
}

function productHaystack(product: ProductInput): string {
  return [product.name, product.category, product.description ?? "", product.summary ?? "", ...product.tags]
    .join(" ")
    .toLowerCase();
}

function matchesExclusion(text: string, term: string): boolean {
  const t = term.toLowerCase();
  if (t.length <= 3) return text.includes(t);
  return text.includes(t);
}

export function isRecipientCompatible(
  product: ProductInput,
  profile: Partial<ShoppingProfile>
): { compatible: boolean; reason?: string } {
  const recipient = normalizeRecipient(profile);
  if (!recipient) return { compatible: true };

  const exclusions = RECIPIENT_EXCLUSIONS[recipient];
  if (!exclusions) return { compatible: true };

  const text = productHaystack(product);
  for (const term of exclusions) {
    if (matchesExclusion(text, term)) {
      return { compatible: false, reason: `Incompatible with ${recipient}: contains "${term}"` };
    }
  }

  return { compatible: true };
}

export function applyRecipientCompatibilityFilter(
  products: ProductInput[],
  profile: Partial<ShoppingProfile>
): { kept: ProductInput[]; rejected: FilterRejection[] } {
  const kept: ProductInput[] = [];
  const rejected: FilterRejection[] = [];

  for (const product of products) {
    const { compatible, reason } = isRecipientCompatible(product, profile);
    if (compatible) {
      kept.push(product);
    } else {
      rejected.push({
        product,
        reason: reason ?? "Recipient incompatible",
        stage: "compatibility",
      });
    }
  }

  return { kept, rejected };
}
