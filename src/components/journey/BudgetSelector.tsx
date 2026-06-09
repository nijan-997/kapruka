"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { budgetOptions } from "@/lib/data";

interface BudgetSelectorProps {
  selected: string;
  onSelect: (id: string, min: number | null, max: number | null) => void;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function BudgetSelector({ selected, onSelect }: BudgetSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      className="space-y-2.5"
    >
      {budgetOptions.map((opt) => (
        <motion.button
          key={opt.id}
          variants={itemVariants}
          onClick={() => onSelect(opt.id, opt.min, opt.max)}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.99 }}
          id={`budget-${opt.id}`}
          aria-pressed={selected === opt.id}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
            selected === opt.id
              ? "border-[#7a9e7e] bg-[#f0f5f0] shadow-[0_0_0_3px_rgba(122,158,126,0.12)]"
              : "border-[#e8e5de] bg-white hover:border-[#a8c5ab] hover:bg-[#f5f9f5]"
          }`}
          style={{ boxShadow: selected === opt.id ? undefined : "0 1px 3px rgba(26,26,24,0.04)" }}
        >
          <div className="flex-1">
            <span className={`font-semibold text-sm block ${selected === opt.id ? "text-[#5a7d5e]" : "text-[#1a1a18]"}`}>
              {opt.label}
            </span>
            <span className="text-[#9b9b90] text-xs mt-0.5 block">{opt.sublabel}</span>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            selected === opt.id ? "border-[#7a9e7e] bg-[#7a9e7e]" : "border-[#e8e5de]"
          }`}>
            {selected === opt.id && (
              <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            )}
          </div>
        </motion.button>
      ))}

      {/* Custom budget */}
      <motion.div variants={itemVariants}>
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            id="budget-custom-toggle"
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-[#e8e5de] text-[#9b9b90] hover:border-[#c49a3c]/50 hover:text-[#c49a3c] hover:bg-[#fdf9f0] transition-all text-sm"
          >
            <span>✨</span>
            <span>A different budget</span>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-2xl border border-[#e8e5de] bg-[#fafaf7]"
          >
            <p className="text-sm text-[#6b6b63] mb-3">Enter your budget range (Rs.)</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                placeholder="Min"
                id="budget-custom-min"
                className="flex-1 bg-white border border-[#e8e5de] rounded-xl px-4 py-2.5 text-[#1a1a18] placeholder-[#9b9b90] outline-none focus:border-[#7a9e7e] text-sm transition-colors"
              />
              <span className="text-[#9b9b90] text-sm">to</span>
              <input
                type="number"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                placeholder="Max"
                id="budget-custom-max"
                className="flex-1 bg-white border border-[#e8e5de] rounded-xl px-4 py-2.5 text-[#1a1a18] placeholder-[#9b9b90] outline-none focus:border-[#7a9e7e] text-sm transition-colors"
              />
              <motion.button
                onClick={() => {
                  if (customMin || customMax) {
                    onSelect("custom", Number(customMin) || null, Number(customMax) || null);
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2.5 sage-gradient rounded-xl text-white text-sm font-medium"
              >
                Set
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
