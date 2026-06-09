import { NextResponse } from "next/server";

export function aiErrorResponse(err: unknown, label: string) {
  console.error(`[${label}]`, err);
  const message = err instanceof Error ? err.message : String(err);
  const isConfigError = message.includes("Missing OPENROUTER_API_KEY");

  return NextResponse.json(
    {
      error: isConfigError ? "AI service not configured" : label,
      details: message,
      ok: false,
    },
    { status: isConfigError ? 503 : 500 }
  );
}
