"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useKapiStore } from "@/lib/store";
import { useVoiceInput } from "@/components/shared/useVoiceInput";
import { nlExamples } from "@/lib/data";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LandingHero() {
  const [value, setValue] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Avoid SSR hydration mismatch for browser-only APIs
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const { reset, updateProfile, setIntent, setLoading, setAIError } = useKapiStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder examples
  useEffect(() => {
    const t = setInterval(() => setExampleIndex((i) => (i + 1) % nlExamples.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Called by voice or typing submit
  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setIsExtracting(true);
      setExtractError(null);
      reset();
      updateProfile({ naturalLanguageQuery: trimmed, shoppingType: "search" });

      try {
        const res = await fetch("/api/ai/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();
        const { intent, profilePatch } = data;

        // Update the store with extracted intent
        setIntent(intent);
        updateProfile({ ...profilePatch, naturalLanguageQuery: trimmed });
        setLoading(false);

        // Navigate to loading screen to run full pipeline
        router.push("/loading-screen");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setExtractError(msg);
        setAIError(msg);
        setIsExtracting(false);
      }
    },
    [reset, updateProfile, setIntent, setLoading, setAIError, router]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(value);
  };

  // Voice input
  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useVoiceInput(
    (text) => {
      setValue(text);
      handleSubmit(text);
    }
  );

  const handleMicClick = () => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl mx-auto px-5"
    >
      {/* Wordmark */}
      <motion.div variants={itemVariants} className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-2xl">🌿</span>
          <span className="font-display text-2xl font-semibold text-[#1a1a18] tracking-tight">Kapi</span>
          <span className="text-xs text-[#9b9b90] tracking-widest uppercase ml-1">by Kapruka</span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[#1a1a18] leading-[1.15] text-balance">
          Find the perfect gift or product in under 2 minutes.
        </h1>
        <p className="mt-4 text-lg text-[#6b6b63] leading-relaxed max-w-lg mx-auto text-balance">
          Tell us what you&apos;re looking for and we&apos;ll help you find the best option.
        </p>
      </motion.div>

      {/* Main NL Input */}
      <motion.div variants={itemVariants}>
        <form onSubmit={handleFormSubmit} className="relative">
          <label className="block text-sm font-medium text-[#6b6b63] mb-2.5 text-center tracking-wide">
            What can I help you find today?
          </label>

          <motion.div
            animate={{
              boxShadow: isFocused
                ? "0 0 0 2px #7a9e7e, 0 8px 32px rgba(122,158,126,0.12)"
                : "0 2px 8px rgba(26,26,24,0.06), 0 0 0 1px #e8e5de",
            }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl overflow-hidden"
          >
            <input
              ref={inputRef}
              id="kapi-main-search"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isExtracting}
              className="w-full bg-transparent px-5 pt-5 pb-14 text-[#1a1a18] text-base md:text-lg placeholder-transparent outline-none leading-relaxed disabled:opacity-60"
              aria-label="What are you looking for?"
            />

            {/* Animated placeholder */}
            {!value && !isListening && (
              <div className="absolute top-5 left-5 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={exampleIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className={`text-base md:text-lg ${isFocused ? "text-[#c8c5bd]" : "text-[#b8b5ac]"}`}
                  >
                    {nlExamples[exampleIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {/* Listening indicator in input */}
            {isListening && (
              <div className="absolute top-5 left-5 pointer-events-none flex items-center gap-2">
                <motion.div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-red-400"
                      animate={{ height: [8, 16, 8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </motion.div>
                <span className="text-red-400 text-sm">Listening…</span>
              </div>
            )}

            {/* Bottom action bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-[#f0ede6]">
              {/* Language chips */}
              <div className="flex items-center gap-2">
                {["English", "සිංහල", "Mixed"].map((l) => (
                  <span key={l} className="text-xs text-[#9b9b90] px-2.5 py-1 rounded-full bg-[#f5f3ee] border border-[#e8e5de]">
                    {l}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {mounted && isSupported && (
                  <motion.button
                    type="button"
                    onClick={handleMicClick}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    id="main-mic-button"
                    aria-label={isListening ? "Stop listening" : "Voice input"}
                    className={`p-2 rounded-xl transition-all ${
                      isListening
                        ? "bg-red-50 text-red-500 border border-red-200"
                        : "text-[#9b9b90] hover:text-[#7a9e7e] hover:bg-[#f0f5f0]"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </motion.button>
                )}

                <motion.button
                  type="submit"
                  disabled={!value.trim() || isExtracting}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  id="main-search-submit"
                  aria-label="Find products"
                  className="flex items-center gap-2 sage-gradient text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity"
                >
                  {isExtracting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Find <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {extractError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-red-500 mt-2"
              >
                {extractError} — please try again.
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </motion.div>
  );
}
