"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { useProfileStore } from "@/lib/store";
import { selfCategories } from "@/lib/data";
import { ArrowLeft, X } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function MyselfJourneyPage() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    updateProfile({ category: id, shoppingType: "myself" });
    setTimeout(() => router.push("/loading-screen"), 400);
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      <div className="max-w-xl mx-auto w-full px-5 py-6 flex-1 flex flex-col">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push("/")} id="myself-back"
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
          <p className="text-xs font-medium text-[#9b9b90] uppercase tracking-widest mb-3">Shop for Myself</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#1a1a18] leading-tight">
            What are you looking for?
          </h1>
          <p className="mt-2 text-[#6b6b63] text-base">Pick a category and we'll find the best options.</p>
        </motion.div>

        {/* Categories */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-3 gap-3">
          {selfCategories.map((cat) => (
            <motion.button key={cat.id} variants={cardVariants} onClick={() => handleSelect(cat.id)}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} id={`cat-${cat.id}`}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-200 ${
                selected === cat.id
                  ? "border-[#7a9e7e] bg-[#f0f5f0] shadow-[0_0_0_3px_rgba(122,158,126,0.15)]"
                  : "border-[#e8e5de] bg-white hover:border-[#a8c5ab] hover:bg-[#f5f9f5]"
              }`}
              style={{ boxShadow: selected === cat.id ? undefined : "0 1px 3px rgba(26,26,24,0.04)" }}>
              <span className="text-2xl">{cat.emoji}</span>
              <span className={`text-xs font-medium leading-tight ${selected === cat.id ? "text-[#5a7d5e]" : "text-[#6b6b63]"}`}>
                {cat.label}
              </span>
            </motion.button>
          ))}

          {/* Something else */}
          <motion.button variants={cardVariants} onClick={() => handleSelect("other")}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} id="cat-other"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-dashed border-[#e8e5de] text-center hover:border-[#c49a3c]/40 hover:bg-[#fdf9f0] transition-all col-span-3">
            <span className="text-xl">✨</span>
            <span className="text-xs font-medium text-[#c49a3c]">Something Else</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
