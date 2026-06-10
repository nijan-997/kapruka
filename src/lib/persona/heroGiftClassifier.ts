import type { ProductInput } from "@/lib/ai/rankRecommendations";

export type GiftType = "HERO" | "SUPPORTING";

const HERO_PATTERNS = [
  /\bjewel(l)?ery\b/,
  /\bgift\s*box\b/,
  /\bhamper\b/,
  /\bbouquet\b/,
  /\bplaque\b/,
  /\bhandbag\b/,
  /\bwatch\b/,
  /\bgadget\b/,
  /\bpremium\b/,
  /\bkeepsake\b/,
  /\bpersonalized\b/,
  /\bengrav/,
  /\bspa\s*(set|hamper|gift)\b/,
  /\bflower\b/,
  /\bperfume\b/,
  /\bleather\b/,
  /\bexecutive\b/,
  /\brecognition\b/,
  /\baward\b/,
  /\btrophy\b/,
  /\bcake\b/,
  /\bsaree\b/,
  /\bnecklace\b/,
  /\bring\b/,
  /\bearring\b/,
  /\bbracelet\b/,
  /\bphoto\s*frame\b/,
  /\bexperience\b/,
];

const SUPPORTING_PATTERNS = [
  /\bgreeting\s*card\b/,
  /\bcard\s*only\b/,
  /\bkeychain\b/,
  /\bkey\s*chain\b/,
  /\bchocolate\s*(bar|piece)?\b/,
  /\bmini\s+mug\b/,
  /\bsmall\s*mug\b/,
  /\badd[\s-]?on\b/,
  /\bdecorative\b/,
  /\bmini\s+accessory\b/,
  /\bpostcard\b/,
  /\bthank\s*you\s*card\b/,
  /\bbirthday\s*card\b/,
];

function haystack(product: ProductInput): string {
  return [product.name, product.category, product.description ?? "", product.summary ?? ""]
    .join(" ")
    .toLowerCase();
}

export function classifyGiftType(product: ProductInput): GiftType {
  const text = haystack(product);

  const isSupporting = SUPPORTING_PATTERNS.some((p) => p.test(text));
  const isHero = HERO_PATTERNS.some((p) => p.test(text));

  if (isSupporting && !isHero) return "SUPPORTING";
  if (isHero) return "HERO";

  const price = product.price;
  if (price >= 2500) return "HERO";
  if (price < 1200 && /card|chocolate|keychain|mug/i.test(text)) return "SUPPORTING";

  return "HERO";
}

export function heroGiftBoost(product: ProductInput): number {
  return classifyGiftType(product) === "HERO" ? 25 : 5;
}
