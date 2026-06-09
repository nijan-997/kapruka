"use client";

import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface JourneyStepProps {
  stepNumber: number;
  totalSteps: number;
  question: string;
  subtext?: string;
  onBack?: () => void;
  showClose?: boolean;
  children: React.ReactNode;
}

export function JourneyStep({
  stepNumber,
  totalSteps,
  question,
  subtext,
  onBack,
  showClose = true,
  children,
}: JourneyStepProps) {
  const router = useRouter();
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      {/* Top accent */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 max-w-xl mx-auto w-full">
        <button
          onClick={onBack || (() => router.back())}
          id="step-back"
          className="flex items-center gap-2 text-[#9b9b90] hover:text-[#1a1a18] transition-colors p-2 -ml-2 rounded-xl hover:bg-[#f5f3ee]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === stepNumber - 1 ? 20 : 6,
                backgroundColor:
                  i < stepNumber
                    ? "#7a9e7e"
                    : i === stepNumber - 1
                    ? "#7a9e7e"
                    : "#e8e5de",
              }}
              style={{ height: 6 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

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

      {/* Thin progress bar */}
      <div className="h-px bg-[#e8e5de] mx-5 max-w-xl mx-auto w-full" style={{ maxWidth: "calc(576px - 40px)", margin: "0 auto" }}>
        <motion.div
          className="h-full bg-[#7a9e7e]"
          initial={{ width: `${((stepNumber - 1) / totalSteps) * 100}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <motion.div
        key={question}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col px-5 py-8 max-w-xl mx-auto w-full"
      >
        {/* Question */}
        <div className="mb-8">
          <p className="text-xs font-medium text-[#9b9b90] uppercase tracking-widest mb-3">
            Step {stepNumber} of {totalSteps}
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
