import { NextRequest, NextResponse } from "next/server";
import { aiErrorResponse } from "@/lib/ai/apiError";
import { generateNextQuestion } from "@/lib/ai/generateQuestions";
import type { ShoppingProfile } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body as { profile: Partial<ShoppingProfile> };

    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const result = await generateNextQuestion(profile);

    return NextResponse.json({
      question: result.question,
      confidence: result.confidence,
      ready: result.ready,
      personaPatch: result.personaPatch ?? null,
      ok: true,
    });
  } catch (err) {
    return aiErrorResponse(err, "Question generation failed");
  }
}
