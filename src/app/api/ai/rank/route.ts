import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/apiError";
import { rankRecommendations } from "@/lib/ai/rankRecommendations";
import { retrieveProducts } from "@/services/commerce/retrieveProducts";
import type { ShoppingProfile } from "@/lib/store";
import type { SearchStrategy } from "@/lib/ai/generateSearchQueries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, strategy } = body as {
      profile: Partial<ShoppingProfile>;
      strategy?: SearchStrategy;
    };

    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    if (!strategy) {
      return NextResponse.json({ error: "strategy is required" }, { status: 400 });
    }

    const retrieval = await retrieveProducts({ profile, strategy });
    const ranking = await rankRecommendations(profile, retrieval.candidates);

    return NextResponse.json({
      ranking,
      products: retrieval.allProducts,
      retrievalDebug: retrieval.debug,
      relevanceScores: retrieval.relevanceScores,
      ok: true,
    });
  } catch (err) {
    return aiErrorResponse(err, "Ranking failed");
  }
}
