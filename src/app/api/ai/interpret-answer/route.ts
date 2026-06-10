import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/apiError";
import { interpretAnswer } from "@/lib/ai/interpretAnswer";
import type { ShoppingProfile } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, field, answer } = body as {
      profile: Partial<ShoppingProfile>;
      field: string;
      answer: string;
    };

    if (!field?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: "field and answer are required" }, { status: 400 });
    }

    const interpreted = await interpretAnswer(profile ?? {}, field, answer.trim());

    return NextResponse.json({ interpreted, ok: true });
  } catch (err) {
    return aiErrorResponse(err, "Answer interpretation failed");
  }
}
