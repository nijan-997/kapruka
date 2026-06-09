"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useKapiStore } from "@/lib/store";
import { loadingMessages } from "@/lib/data";

export default function LoadingPage() {
  const [step, setStep] = useState(0);
  const [statusLine, setStatusLine] = useState("");
  const router = useRouter();
  const { profile, setSearchStrategy, setRanking, setAIError, setLoading } = useKapiStore();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function runPipeline() {
      try {
        // Step 0-1: Show first two messages while generating search strategy
        setStep(0);
        setLoading(true, loadingMessages[0]);
        setStatusLine(loadingMessages[0]);

        const stratRes = await fetch("/api/ai/search-strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });

        if (!stratRes.ok) throw new Error("Search strategy failed");
        const { strategy } = await stratRes.json();
        setSearchStrategy(strategy);

        // Step 2-3: Rank recommendations
        setStep(2);
        setStatusLine(loadingMessages[2]);

        const rankRes = await fetch("/api/ai/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, strategy }),
        });

        if (!rankRes.ok) throw new Error("Ranking failed");
        const { ranking, products } = await rankRes.json();
        setRanking(ranking, products);

        // Step 4: Almost ready
        setStep(4);
        setStatusLine(loadingMessages[4]);
        setLoading(false);

        await new Promise((r) => setTimeout(r, 700));
        router.push("/recommendations");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setAIError(msg);
        setLoading(false);
        // Still navigate — recommendations page handles missing state gracefully
        setTimeout(() => router.push("/recommendations"), 1500);
      }
    }

    // Animate loading messages in parallel with API calls
    let i = 0;
    const msgTimer = setInterval(() => {
      i = Math.min(i + 1, loadingMessages.length - 1);
      setStep(i);
    }, 900);

    runPipeline().finally(() => clearInterval(msgTimer));

    return () => clearInterval(msgTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = ((step + 1) / loadingMessages.length) * 100;

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col items-center justify-center px-6">
      <div className="fixed top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      {/* Breathing orb */}
      <div className="relative flex items-center justify-center mb-14">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#7a9e7e]/10"
            style={{ width: 80 + i * 60, height: 80 + i * 60 }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="relative w-16 h-16 rounded-full bg-white border border-[#e8e5de] flex items-center justify-center"
          style={{ boxShadow: "0 4px 20px rgba(122,158,126,0.2)" }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-2xl">🌿</span>
        </motion.div>
      </div>

      {/* Message */}
      <div className="h-12 flex items-center justify-center mb-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display text-2xl md:text-3xl font-medium text-[#1a1a18] text-center"
          >
            {loadingMessages[step] ?? statusLine}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-[#e8e5de] rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full rounded-full bg-[#7a9e7e]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {loadingMessages.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === step ? 20 : 6,
              height: 6,
              backgroundColor: i <= step ? "#7a9e7e" : "#e8e5de",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
