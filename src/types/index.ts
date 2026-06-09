export type JourneyType = "gift" | "myself" | "inspire" | "search";

export type Recipient =
  | "mother"
  | "father"
  | "partner"
  | "friend"
  | "child"
  | "colleague"
  | "client"
  | "myself"
  | "someone_else";

export type Occasion =
  | "birthday"
  | "anniversary"
  | "graduation"
  | "wedding"
  | "housewarming"
  | "thank_you"
  | "just_because"
  | "festival"
  | "other";

export type Budget = "under_5k" | "5k_10k" | "10k_20k" | "20k_plus" | "custom";

export type DeliveryTime = "today" | "tomorrow" | "this_week" | "flexible" | "specific";

export interface JourneyState {
  type: JourneyType | null;
  step: number;
  recipient: Recipient | null;
  recipientCustom: string | null;
  occasion: Occasion | null;
  occasionCustom: string | null;
  budget: Budget | null;
  budgetCustom: number | null;
  deliveryTime: DeliveryTime | null;
  deliveryDate: string | null;
  interests: string[];
  category: string | null;
  naturalLanguageQuery: string | null;
  isLoading: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  delivery: DeliveryInfo;
  tags: string[];
  description: string;
  highlights: string[];
}

export interface DeliveryInfo {
  available: boolean;
  eta: string;
  fee: number;
  express: boolean;
  expressEta?: string;
  expressFee?: number;
}

export interface Recommendation {
  product: Product;
  variant: "best_pick" | "most_loved" | "unique" | "premium";
  matchScore: number;
  aiReason: string;
  trustChips: TrustChip[];
}

export interface TrustChip {
  label: string;
  icon: string;
  active: boolean;
}

export interface GiftMessage {
  to: string;
  from: string;
  message: string;
}
