"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, ArrowRight } from "lucide-react";

interface TellMeMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title?: string;
  suggestions?: Array<{ emoji: string; label: string }>;
}

const defaultSuggestions = [
  { emoji: "👔", label: "Boss" },
  { emoji: "📚", label: "Teacher" },
  { emoji: "👶", label: "New Baby" },
  { emoji: "👴", label: "Grandparent" },
  { emoji: "🧑‍🤝‍🧑", label: "Cousin" },
  { emoji: "💝", label: "Crush" },
  { emoji: "🥰", label: "Best Friend" },
  { emoji: "👰", label: "Bride" },
];

export function TellMeMoreSheet({
  isOpen,
  onClose,
  onSelect,
  title = "Tell me more.",
  suggestions = defaultSuggestions,
}: TellMeMoreSheetProps) {
  const [customValue, setCustomValue] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
    setTimeout(() => {
      onSelect(label);
      setSelected(null);
      onClose();
    }, 350);
  };

  const handleCustom = () => {
    if (customValue.trim()) {
      onSelect(customValue.trim());
      setCustomValue("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1a1a18]/30 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-[#e8e5de] p-6 pb-10 max-w-xl mx-auto"
            style={{ boxShadow: "0 -8px 40px rgba(26,26,24,0.08)" }}
          >
            {/* Handle */}
            <div className="w-8 h-1 bg-[#e8e5de] rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#1a1a18]">{title}</h3>
                <p className="text-[#9b9b90] text-sm mt-1">Pick one or type your own below.</p>
              </div>
              <button
                onClick={onClose}
                className="text-[#9b9b90] hover:text-[#1a1a18] p-2 rounded-xl hover:bg-[#f5f3ee] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {suggestions.map((s) => (
                <motion.button
                  key={s.label}
                  onClick={() => handleSelect(s.label)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  id={`sheet-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    selected === s.label
                      ? "border-[#7a9e7e] bg-[#f0f5f0]"
                      : "border-[#e8e5de] bg-[#fafaf7] hover:border-[#a8c5ab] hover:bg-[#f5f9f5]"
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-[#6b6b63] text-xs font-medium text-center leading-tight">{s.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustom()}
                placeholder="Or describe them..."
                id="sheet-custom-input"
                className="flex-1 bg-[#fafaf7] border border-[#e8e5de] rounded-xl px-4 py-3 text-[#1a1a18] placeholder-[#9b9b90] outline-none focus:border-[#7a9e7e] transition-colors text-sm"
                autoFocus
              />
              <motion.button
                onClick={handleCustom}
                whileTap={{ scale: 0.95 }}
                disabled={!customValue.trim()}
                className="px-4 py-3 sage-gradient rounded-xl text-white disabled:opacity-40 transition-opacity"
                aria-label="Confirm"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
