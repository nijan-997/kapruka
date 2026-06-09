import { LandingHero } from "@/components/landing/LandingHero";
import { GuidedEntryCards } from "@/components/landing/GuidedEntryCards";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafaf7] flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a, #c49a3c)" }} />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 gap-10">
        <LandingHero />

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-2xl px-5">
          <div className="flex-1 h-px bg-[#e8e5de]" />
          <span className="text-xs text-[#9b9b90] tracking-wide whitespace-nowrap">or browse by type</span>
          <div className="flex-1 h-px bg-[#e8e5de]" />
        </div>

        <GuidedEntryCards />
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-[#9b9b90] tracking-wide">
          Powered by Kapruka · Delivering across Sri Lanka since 2007
        </p>
      </div>
    </main>
  );
}
