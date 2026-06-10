import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/apiError";
import { generateExploreStrategy } from "@/lib/ai/generateExploreStrategy";
import { rankRecommendations } from "@/lib/ai/rankRecommendations";
import { retrieveProducts } from "@/services/commerce/retrieveProducts";
import type { ShoppingProfile } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, seenProductIds = [], previousQueries = [] } = body as {
      profile: Partial<ShoppingProfile>;
      seenProductIds?: string[];
      previousQueries?: string[];
    };

    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const totalStart = performance.now();
    const strategyStart = performance.now();
    const strategy = await generateExploreStrategy(profile, previousQueries);
    const searchStrategyMs = Math.round(performance.now() - strategyStart);

    const retrieval = await retrieveProducts({
      profile,
      strategy,
      excludeProductIds: seenProductIds,
    });

    const { ranking, explanationMs } = await rankRecommendations(profile, retrieval.candidates);
    const totalMs = Math.round(performance.now() - totalStart);

    const performanceTimings = {
      ...retrieval.debug.performanceMs,
      searchStrategyMs,
      explanationMs,
      rankingMs: explanationMs,
      totalMs,
    };

    return NextResponse.json({
      strategy,
      ranking,
      allScoredProducts: retrieval.allScoredProducts,
      retrievalDebug: {
        ...retrieval.debug,
        performanceMs: performanceTimings,
      },
      deterministicScores: retrieval.deterministicScores,
      performanceTimings,
      ok: true,
    });
  } catch (err) {
    return aiErrorResponse(err, "Explore recommendations failed");
  }
}
