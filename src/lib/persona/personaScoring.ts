import type { PersonaAgeGroup, PersonaGender, RecipientPersona } from "./recipientPersona";

export function genderBoostKeywords(gender: PersonaGender): string[] {
  if (gender === "female") {
    return [
      "jewelry",
      "jewellery",
      "fashion",
      "beauty",
      "skincare",
      "spa",
      "flowers",
      "perfume",
      "saree",
      "handbag",
      "personalized",
      "chocolate",
    ];
  }
  if (gender === "male") {
    return [
      "tech",
      "electronics",
      "gadget",
      "gaming",
      "watch",
      "wallet",
      "leather",
      "grooming",
      "accessories",
      "practical",
      "tool",
      "speaker",
    ];
  }
  return [];
}

export function genderPenalizeKeywords(gender: PersonaGender): string[] {
  if (gender === "female") {
    return ["gaming", "tools", "gadget kit", "beard", "men's"];
  }
  if (gender === "male") {
    return ["saree", "handbag", "maternity", "bridal", "women's", "lipstick"];
  }
  return [];
}

export function ageGroupBoostKeywords(ageGroup: PersonaAgeGroup): string[] {
  switch (ageGroup) {
    case "child":
      return ["toy", "kids", "children", "game", "educational", "cute", "plush"];
    case "teen":
      return ["trendy", "music", "gaming", "accessories", "tech", "sport", "novelty"];
    case "young_adult":
      return [
        "trendy",
        "tech",
        "fashion",
        "jewelry",
        "experience",
        "personalized",
        "gadget",
        "lifestyle",
      ];
    case "adult":
      return ["premium", "practical", "home", "gourmet", "hamper", "executive", "thoughtful"];
    case "senior":
      return [
        "keepsake",
        "health",
        "wellness",
        "comfort",
        "tea",
        "appreciation",
        "recognition",
        "commemorative",
        "classic",
      ];
    default:
      return [];
  }
}

export function ageGroupPenalizeKeywords(ageGroup: PersonaAgeGroup): string[] {
  switch (ageGroup) {
    case "child":
      return ["alcohol", "wine", "romantic", "executive", "office", "adult"];
    case "teen":
      return ["alcohol", "wine", "baby", "infant", "retirement"];
    case "young_adult":
      return ["baby", "infant", "retirement", "senior"];
    case "adult":
      return ["baby", "infant", "toy", "kids"];
    case "senior":
      return ["gaming", "novelty", "kids", "teen", "party"];
    default:
      return [];
  }
}

/** Combined persona keyword boosts for scoring. */
export function personaBoostKeywords(persona: RecipientPersona): string[] {
  return [
    ...genderBoostKeywords(persona.gender),
    ...ageGroupBoostKeywords(persona.ageGroup),
  ];
}

export function personaPenalizeKeywords(persona: RecipientPersona): string[] {
  return [
    ...genderPenalizeKeywords(persona.gender),
    ...ageGroupPenalizeKeywords(persona.ageGroup),
  ];
}
