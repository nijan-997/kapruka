"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { useProfileStore } from "@/lib/store";
import { discoveryVibes } from "@/lib/data";
import { ArrowLeft, X } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function InspireJourneyPage() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    updateProfile({ category: id, shoppingType: "inspire" });
    setTimeout(() => router.push("/loading-screen"), 400);
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      <div className="max-w-xl mx-auto w-full px-5 py-6 flex-1 flex flex-col pb-16">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/")} id="inspire-back"
            className="flex items-center gap-2 text-[#9b9b90] hover:text-[#1a1a18] p-2 -ml-2 rounded-xl hover:bg-[#f5f3ee] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <button onClick={() => router.push("/")} className="text-[#9b9b90] hover:text-[#1a1a18] p-2 rounded-xl hover:bg-[#f5f3ee] transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <p className="text-xs font-medium text-[#9b9b90] uppercase tracking-widest mb-3">Inspire Me</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#1a1a18] leading-tight">
            What vibe are you feeling?
          </h1>
          <p className="mt-2 text-[#6b6b63] text-base">
            Pick something that speaks to you and we&apos;ll take it from there.
          </p>
        </motion.div>

        {/* Discovery grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          {discoveryVibes.map((vibe) => (
            <motion.button
              key={vibe.id}
              variants={cardVariants}
              onClick={() => handleSelect(vibe.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              id={`vibe-${vibe.id}`}
              className={`flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200 ${
                selected === vibe.id
                  ? "border-[#7a9e7e] bg-[#f0f5f0] shadow-[0_0_0_3px_rgba(122,158,126,0.15)]"
                  : `${vibe.color} hover:shadow-md`
              }`}
              style={{ boxShadow: selected === vibe.id ? undefined : "0 1px 3px rgba(26,26,24,0.04)" }}
            >
              <span className="text-2xl">{vibe.emoji}</span>
              <div>
                <span className="font-semibold text-sm text-[#1a1a18] leading-tight block">{vibe.label}</span>
                <motion.span
                  className="text-xs text-[#9b9b90] mt-1 block"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Explore →
                </motion.span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
