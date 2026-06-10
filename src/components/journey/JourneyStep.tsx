"use client";

import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface JourneyStepProps {
  progressLabel?: string;
  confidence?: number;
  question: string;
  subtext?: string;
  onBack?: () => void;
  showClose?: boolean;
  children: React.ReactNode;
}

export function JourneyStep({
  progressLabel = "Understanding you...",
  confidence = 0,
  question,
  subtext,
  onBack,
  showClose = true,
  children,
}: JourneyStepProps) {
  const router = useRouter();
  const progress = Math.min(100, Math.max(12, confidence));

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      <div className="flex items-center justify-between px-5 py-4 max-w-xl mx-auto w-full">
        <button
          onClick={onBack || (() => router.back())}
          id="step-back"
          className="flex items-center gap-2 text-[#9b9b90] hover:text-[#1a1a18] transition-colors p-2 -ml-2 rounded-xl hover:bg-[#f5f3ee]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <p className="text-xs text-[#9b9b90] tracking-wide hidden sm:block">{progressLabel}</p>

        {showClose && (
          <button
            onClick={() => router.push("/")}
            id="step-close"
            className="text-[#9b9b90] hover:text-[#1a1a18] p-2 rounded-xl hover:bg-[#f5f3ee] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="h-0.5 bg-[#e8e5de] mx-5 max-w-xl w-full self-center rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <motion.div
        key={question}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 flex flex-col px-5 py-8 max-w-xl mx-auto w-full"
      >
        <div className="mb-8">
          <p className="text-xs font-medium text-[#9b9b90] tracking-wide mb-3 sm:hidden">
            {progressLabel}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1a1a18] leading-tight text-balance">
            {question}
          </h2>
          {subtext && (
            <p className="mt-2.5 text-[#6b6b63] text-base leading-relaxed">{subtext}</p>
          )}
        </div>

        {children}
      </motion.div>
    </div>
  );
}
