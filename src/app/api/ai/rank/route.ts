import { NextRequest, NextResponse } from "next/server";
import { rankRecommendations } from "@/lib/ai/rankRecommendations";
import { searchProducts } from "@/services/commerce/searchProducts";
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

    // Fetch products using the search strategy (mock for now)
    const queries = strategy?.queries ?? [profile.category ?? "gift"];
    const priceFilter = strategy?.priceFilter ?? {
      min: profile.budgetMin ?? null,
      max: profile.budgetMax ?? null,
    };

    const products = await searchProducts({
      queries,
      priceFilter,
      categories: strategy?.categories,
      limit: 12,
    });

    // Rank with OpenRouter
    const ranking = await rankRecommendations(profile, products);

    return NextResponse.json({ ranking, products, ok: true });
  } catch (err) {
    console.error("[/api/ai/rank]", err);
    return NextResponse.json(
      { error: "Ranking failed", details: String(err) },
      { status: 500 }
    );
  }
}
