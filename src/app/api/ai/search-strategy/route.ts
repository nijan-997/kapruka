import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/apiError";
import { generateSearchStrategy } from "@/lib/ai/generateSearchQueries";
import type { ShoppingProfile } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body as { profile: Partial<ShoppingProfile> };

    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const strategy = await generateSearchStrategy(profile);

    return NextResponse.json({ strategy, ok: true });
  } catch (err) {
    return aiErrorResponse(err, "Search strategy generation failed");
  }
}
