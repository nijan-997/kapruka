import { create } from "zustand";
import type { ExtractedIntent } from "@/lib/ai/extractIntent";
import type { NextQuestion } from "@/lib/ai/generateQuestions";
import type { SearchStrategy } from "@/lib/ai/generateSearchQueries";
import type { RankingResult } from "@/lib/ai/rankRecommendations";
import type { ProductInput } from "@/lib/ai/rankRecommendations";

// ─── Shopping Profile ────────────────────────────────────────────────────────
export interface ShoppingProfile {
  shoppingType: "gift" | "myself" | "inspire" | "search" | "";
  recipient: string;
  recipientCustom: string;
  occasion: string;
  occasionCustom: string;
  budget: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deliveryDate: string;
  interests: string[];
  category: string;
  naturalLanguageQuery: string;
  language: string;
  step: number;
}

// ─── AI State ────────────────────────────────────────────────────────────────
export interface AIState {
  isLoading: boolean;
  loadingMessage: string;
  lastIntent: ExtractedIntent | null;
  nextQuestion: NextQuestion | null;
  searchStrategy: SearchStrategy | null;
  ranking: RankingResult | null;
  products: ProductInput[];
  error: string | null;
  missingInformation: string[];
}

// ─── Full Store ───────────────────────────────────────────────────────────────
export interface KapiStore {
  profile: ShoppingProfile;
  ai: AIState;

  // Profile actions
  updateProfile: (patch: Partial<ShoppingProfile>) => void;
  toggleInterest: (interest: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;

  // AI actions
  setLoading: (loading: boolean, message?: string) => void;
  setIntent: (intent: ExtractedIntent) => void;
  setNextQuestion: (q: NextQuestion | null) => void;
  setSearchStrategy: (s: SearchStrategy) => void;
  setRanking: (r: RankingResult, products: ProductInput[]) => void;
  setAIError: (err: string | null) => void;

  // Reset
  reset: () => void;
}

const defaultProfile: ShoppingProfile = {
  shoppingType: "",
  recipient: "",
  recipientCustom: "",
  occasion: "",
  occasionCustom: "",
  budget: "",
  budgetMin: null,
  budgetMax: null,
  deliveryDate: "",
  interests: [],
  category: "",
  naturalLanguageQuery: "",
  language: "english",
  step: 0,
};

const defaultAI: AIState = {
  isLoading: false,
  loadingMessage: "",
  lastIntent: null,
  nextQuestion: null,
  searchStrategy: null,
  ranking: null,
  products: [],
  error: null,
  missingInformation: [],
};

export const useKapiStore = create<KapiStore>()((set) => ({
  profile: { ...defaultProfile },
  ai: { ...defaultAI },

  updateProfile: (patch) =>
    set((s) => ({ profile: { ...s.profile, ...patch } })),

  toggleInterest: (interest) =>
    set((s) => ({
      profile: {
        ...s.profile,
        interests: s.profile.interests.includes(interest)
          ? s.profile.interests.filter((i) => i !== interest)
          : [...s.profile.interests, interest],
      },
    })),

  nextStep: () =>
    set((s) => ({ profile: { ...s.profile, step: s.profile.step + 1 } })),

  prevStep: () =>
    set((s) => ({
      profile: { ...s.profile, step: Math.max(0, s.profile.step - 1) },
    })),

  setStep: (step) =>
    set((s) => ({ profile: { ...s.profile, step } })),

  setLoading: (isLoading, loadingMessage = "") =>
    set((s) => ({ ai: { ...s.ai, isLoading, loadingMessage } })),

  setIntent: (intent) =>
    set((s) => ({
      ai: {
        ...s.ai,
        lastIntent: intent,
        missingInformation: intent.missingInformation ?? [],
      },
    })),

  setNextQuestion: (q) =>
    set((s) => ({ ai: { ...s.ai, nextQuestion: q } })),

  setSearchStrategy: (strategy) =>
    set((s) => ({ ai: { ...s.ai, searchStrategy: strategy } })),

  setRanking: (ranking, products) =>
    set((s) => ({ ai: { ...s.ai, ranking, products } })),

  setAIError: (err) =>
    set((s) => ({ ai: { ...s.ai, error: err } })),

  reset: () =>
    set({ profile: { ...defaultProfile }, ai: { ...defaultAI } }),
}));

// Keep backwards-compatible alias used by some pages
export const useProfileStore = useKapiStore;
