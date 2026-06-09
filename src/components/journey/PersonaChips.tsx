"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { interests } from "@/lib/data";
import { Plus } from "lucide-react";

interface PersonaChipsProps {
  selected: string[];
  onToggle: (interest: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 280, damping: 22 } },
};

export function PersonaChips({ selected, onToggle }: PersonaChipsProps) {
  const [showInput, setShowInput] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleAdd = () => {
    if (customValue.trim()) {
      onToggle(customValue.trim());
      setCustomValue("");
      setShowInput(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-[#9b9b90] mb-4">Select all that apply.</p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2"
      >
        {interests.map((interest) => {
          const isSelected = selected.includes(interest.label);
          return (
            <motion.button
              key={interest.label}
              variants={chipVariants}
              onClick={() => onToggle(interest.label)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              id={`persona-${interest.label.toLowerCase().replace(/\s+/g, "-")}`}
              aria-pressed={isSelected}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm transition-all duration-200 ${
                isSelected
                  ? "border-[#7a9e7e] bg-[#f0f5f0] text-[#5a7d5e] font-medium shadow-[0_0_0_2px_rgba(122,158,126,0.15)]"
                  : "border-[#e8e5de] bg-white text-[#6b6b63] hover:border-[#a8c5ab] hover:bg-[#f5f9f5]"
              }`}
              style={{ boxShadow: isSelected ? undefined : "0 1px 2px rgba(26,26,24,0.04)" }}
            >
              <span className="text-base leading-none">{interest.emoji}</span>
              <span>{interest.label}</span>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-[#7a9e7e] text-xs"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {/* Custom interests already added */}
        {selected
          .filter((s) => !interests.find((i) => i.label === s))
          .map((custom) => (
            <motion.button
              key={custom}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => onToggle(custom)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#c49a3c]/40 bg-[#fdf9f0] text-[#c49a3c] text-sm font-medium"
            >
              ✨ {custom} ✓
            </motion.button>
          ))}

        {/* Add custom */}
        {!showInput ? (
          <motion.button
            variants={chipVariants}
            onClick={() => setShowInput(true)}
            whileHover={{ y: -1 }}
            id="persona-add-custom"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed border-[#e8e5de] text-[#9b9b90] hover:border-[#c49a3c]/50 hover:text-[#c49a3c] text-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Something Else
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            className="flex gap-2"
          >
            <input
              autoFocus
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setShowInput(false);
              }}
              placeholder="Type an interest..."
              id="persona-custom-input"
              className="bg-[#fafaf7] border border-[#e8e5de] rounded-xl px-4 py-2.5 text-[#1a1a18] placeholder-[#9b9b90] outline-none focus:border-[#7a9e7e] text-sm transition-colors w-44"
            />
            <button onClick={handleAdd} className="px-3 py-2.5 bg-[#f0f5f0] border border-[#a8c5ab] rounded-xl text-[#5a7d5e] text-sm font-medium hover:bg-[#e8f0e8] transition-colors">
              Add
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
