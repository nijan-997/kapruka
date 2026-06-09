import { NextRequest, NextResponse } from "next/server";
import { generateNextQuestion } from "@/lib/ai/generateQuestions";
import type { ShoppingProfile } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body as { profile: Partial<ShoppingProfile> };

    if (!profile) {
      return NextResponse.json({ error: "profile is required" }, { status: 400 });
    }

    const question = await generateNextQuestion(profile);

    return NextResponse.json({
      question,
      ready: question === null,
      ok: true,
    });
  } catch (err) {
    console.error("[/api/ai/questions]", err);
    return NextResponse.json(
      { error: "Question generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
