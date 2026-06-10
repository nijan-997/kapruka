import { create } from "zustand";
import type { ExtractedIntent } from "@/lib/ai/extractIntent";
import type { DynamicQuestion } from "@/lib/ai/generateQuestions";
import type { SearchStrategy } from "@/lib/ai/generateSearchQueries";
import type { RankingResult, ProductInput } from "@/lib/ai/rankRecommendations";
import type { RetrievalDebug, PerformanceTimings } from "@/services/commerce/retrievalTypes";
import type { ProductScore } from "@/services/commerce/scoreProduct";
import type { GiftStrategy } from "@/lib/persona/giftStrategyEngine";
import type { ScoredProduct } from "@/services/commerce/retrievalTypes";
import {
  RECOMMENDATION_PAGE_SIZE,
  buildBrowseProducts,
  computeBrowseAnalytics,
  createSessionId,
  defaultBrowseState,
  getBrowsePool,
  getHeroProductIds,
  type RecommendationBrowseState,
  type RecommendationSession,
} from "@/lib/recommendationBrowse";

export interface CustomAnswer {
  field: string;
  label: string;
  value: string;
}

export interface ShoppingProfile {
  shoppingType: "gift" | "myself" | "search" | "";
  // Gift mode
  recipient: string;
  recipientCustom: string;
  gender: string;
  ageGroup: string;
  relationship: string;
  occasion: string;
  occasionCustom: string;
  emotionalGoal: string;
  interests: string[];
  // Myself mode
  category: string;
  goal: string;
  priority: string;
  urgency: string;
  // Shared
  budget: string;
  budgetMin: number | null;
  budgetMax: number | null;
  deliveryDate: string;
  naturalLanguageQuery: string;
  language: string;
  customAnswers: CustomAnswer[];
}

export interface AIState {
  isLoading: boolean;
  loadingMessage: string;
  lastIntent: ExtractedIntent | null;
  nextQuestion: DynamicQuestion | null;
  searchStrategy: SearchStrategy | null;
  ranking: RankingResult | null;
  products: ProductInput[];
  retrievalDebug: RetrievalDebug | null;
  giftStrategy: GiftStrategy | null;
  deterministicScores: ProductScore[];
  performanceTimings: PerformanceTimings | null;
  error: string | null;
  missingInformation: string[];
}

export interface KapiStore {
  profile: ShoppingProfile;
  ai: AIState;
  recommendations: RecommendationBrowseState;

  updateProfile: (patch: Partial<ShoppingProfile>) => void;
  toggleInterest: (interest: string) => void;

  setLoading: (loading: boolean, message?: string) => void;
  setIntent: (intent: ExtractedIntent) => void;
  setNextQuestion: (q: DynamicQuestion | null) => void;
  setSearchStrategy: (s: SearchStrategy) => void;
  setRanking: (
    r: RankingResult,
    products: ProductInput[],
    retrievalDebug?: RetrievalDebug | null,
    deterministicScores?: ProductScore[],
    performanceTimings?: PerformanceTimings | null,
    allScoredProducts?: ScoredProduct[],
    giftStrategy?: GiftStrategy | null
  ) => void;
  setAIError: (err: string | null) => void;

  initRecommendationBrowse: (
    allScoredProducts: ScoredProduct[],
    ranking: RankingResult,
    strategyReasoning?: string
  ) => void;
  loadMoreRecommendations: () => void;
  appendExploreSession: (
    allScoredProducts: ScoredProduct[],
    strategyReasoning?: string
  ) => void;
  setExploring: (isExploring: boolean) => void;
  getAllPreviousQueries: () => string[];

  reset: () => void;
}

const defaultProfile: ShoppingProfile = {
  shoppingType: "",
  recipient: "",
  recipientCustom: "",
  gender: "",
  ageGroup: "",
  relationship: "",
  occasion: "",
  occasionCustom: "",
  emotionalGoal: "",
  interests: [],
  category: "",
  goal: "",
  priority: "",
  urgency: "",
  budget: "",
  budgetMin: null,
  budgetMax: null,
  deliveryDate: "",
  naturalLanguageQuery: "",
  language: "english",
  customAnswers: [],
};

const defaultAI: AIState = {
  isLoading: false,
  loadingMessage: "",
  lastIntent: null,
  nextQuestion: null,
  searchStrategy: null,
  ranking: null,
  products: [],
  retrievalDebug: null,
  giftStrategy: null,
  deterministicScores: [],
  performanceTimings: null,
  error: null,
  missingInformation: [],
};

function syncBrowseAnalytics(
  sessions: RecommendationSession[],
  ranking: RankingResult | null,
  displayedCount: number,
  loadMoreClicks: number,
  exploreClicks: number
) {
  const heroIds = getHeroProductIds(ranking);
  return computeBrowseAnalytics(sessions, heroIds, displayedCount, loadMoreClicks, exploreClicks);
}

export const useKapiStore = create<KapiStore>()((set, get) => ({
  profile: { ...defaultProfile },
  ai: { ...defaultAI },
  recommendations: { ...defaultBrowseState },

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

  setRanking: (
    ranking,
    products,
    retrievalDebug = null,
    deterministicScores = [],
    performanceTimings = null,
    allScoredProducts,
    giftStrategy = null
  ) => {
    set((s) => ({
      ai: {
        ...s.ai,
        ranking,
        products,
        retrievalDebug,
        giftStrategy: giftStrategy ?? null,
        deterministicScores,
        performanceTimings,
      },
    }));
    if (allScoredProducts && allScoredProducts.length > 0) {
      get().initRecommendationBrowse(
        allScoredProducts,
        ranking,
        retrievalDebug?.generatedQueries?.join(", ")
      );
    }
  },

  setAIError: (err) =>
    set((s) => ({ ai: { ...s.ai, error: err } })),

  initRecommendationBrowse: (allScoredProducts, ranking, strategyReasoning) => {
    const heroIds = getHeroProductIds(ranking);
    const session: RecommendationSession = {
      id: createSessionId("initial"),
      type: "initial",
      createdAt: Date.now(),
      allRecommendations: buildBrowseProducts(allScoredProducts),
      strategyReasoning,
    };
    const displayedCount = RECOMMENDATION_PAGE_SIZE;
    const seenProductIds = [
      ...heroIds,
      ...getBrowsePool([session], heroIds).slice(0, displayedCount).map((p) => p.product.id),
    ];

    set({
      recommendations: {
        sessions: [session],
        seenProductIds: Array.from(new Set(seenProductIds)),
        displayedCount,
        pageSize: RECOMMENDATION_PAGE_SIZE,
        isExploring: false,
        analytics: syncBrowseAnalytics([session], ranking, displayedCount, 0, 0),
      },
    });
  },

  loadMoreRecommendations: () => {
    const state = get();
    const { recommendations, ai } = state;
    const heroIds = getHeroProductIds(ai.ranking);
    const pool = getBrowsePool(recommendations.sessions, heroIds);
    const newDisplayedCount = Math.min(
      recommendations.displayedCount + recommendations.pageSize,
      pool.length
    );
    const newlyShown = pool
      .slice(recommendations.displayedCount, newDisplayedCount)
      .map((p) => p.product.id);
    const seenProductIds = Array.from(
      new Set([...recommendations.seenProductIds, ...newlyShown])
    );
    const loadMoreClicks = recommendations.analytics.loadMoreClicks + 1;

    set({
      recommendations: {
        ...recommendations,
        displayedCount: newDisplayedCount,
        seenProductIds,
        analytics: syncBrowseAnalytics(
          recommendations.sessions,
          ai.ranking,
          newDisplayedCount,
          loadMoreClicks,
          recommendations.analytics.exploreDifferentIdeasClicks
        ),
      },
    });
  },

  appendExploreSession: (allScoredProducts, strategyReasoning) => {
    const state = get();
    const { recommendations, ai } = state;
    if (allScoredProducts.length === 0) {
      set({ recommendations: { ...recommendations, isExploring: false } });
      return;
    }

    const session: RecommendationSession = {
      id: createSessionId("explore"),
      type: "explore",
      createdAt: Date.now(),
      allRecommendations: buildBrowseProducts(allScoredProducts),
      strategyReasoning,
    };
    const sessions = [...recommendations.sessions, session];
    const heroIds = getHeroProductIds(ai.ranking);
    const pool = getBrowsePool(sessions, heroIds);
    const newDisplayedCount = Math.min(
      recommendations.displayedCount + recommendations.pageSize,
      pool.length
    );
    const newlyShown = pool
      .slice(recommendations.displayedCount, newDisplayedCount)
      .map((p) => p.product.id);
    const seenProductIds = Array.from(
      new Set([...recommendations.seenProductIds, ...newlyShown])
    );
    const exploreClicks = recommendations.analytics.exploreDifferentIdeasClicks + 1;

    set({
      recommendations: {
        ...recommendations,
        sessions,
        displayedCount: newDisplayedCount,
        seenProductIds,
        isExploring: false,
        analytics: syncBrowseAnalytics(
          sessions,
          ai.ranking,
          newDisplayedCount,
          recommendations.analytics.loadMoreClicks,
          exploreClicks
        ),
      },
    });
  },

  setExploring: (isExploring) =>
    set((s) => ({
      recommendations: { ...s.recommendations, isExploring },
    })),

  getAllPreviousQueries: () => {
    const { ai } = get();
    const fromStrategy = ai.searchStrategy?.queries ?? [];
    const fromDebug = ai.retrievalDebug?.generatedQueries ?? [];
    return Array.from(new Set([...fromStrategy, ...fromDebug]));
  },

  reset: () =>
    set({
      profile: { ...defaultProfile },
      ai: { ...defaultAI },
      recommendations: { ...defaultBrowseState },
    }),
}));

export const useProfileStore = useKapiStore;
