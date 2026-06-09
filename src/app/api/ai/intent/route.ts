import { NextRequest, NextResponse } from "next/server";
import { extractIntent, intentToProfile } from "@/lib/ai/extractIntent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body as { message: string };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const intent = await extractIntent(message.trim());
    const profilePatch = intentToProfile(intent);

    return NextResponse.json({
      intent,
      profilePatch,
      ok: true,
    });
  } catch (err) {
    console.error("[/api/ai/intent]", err);
    return NextResponse.json(
      { error: "Intent extraction failed", details: String(err) },
      { status: 500 }
    );
  }
}
