"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { budgetOptions } from "@/lib/data";

interface BudgetPillsSliderProps {
  predictedAnswers: Array<{ id: string; emoji?: string; label: string; value: string }>;
  onSelectPreset: (id: string, label: string, value: string) => void;
  onSelectRange: (min: number, max: number) => void;
  onSomethingElse: () => void;
}

export function BudgetPillsSlider({
  predictedAnswers,
  onSelectPreset,
  onSelectRange,
  onSomethingElse,
}: BudgetPillsSliderProps) {
  const [showSlider, setShowSlider] = useState(false);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(10000);

  const presets = predictedAnswers.filter((a) => a.value !== "custom");
  const somethingElse = predictedAnswers.find((a) => a.id === "something_else");

  const handlePreset = (answer: (typeof predictedAnswers)[0]) => {
    if (answer.value === "custom") {
      setShowSlider(true);
      return;
    }
    const preset = budgetOptions.find((b) => b.id === answer.value);
    if (preset) {
      onSelectPreset(preset.id, answer.label, preset.id);
      return;
    }
    if (answer.value === "no_preference") {
      onSelectPreset("no_preference", answer.label, "no_preference");
      return;
    }
    onSelectPreset(answer.id, answer.label, answer.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        {presets.map((answer) => (
          <motion.button
            key={answer.id}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handlePreset(answer)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[#e8e5de] bg-white text-sm font-medium text-[#1a1a18] hover:border-[#7a9e7e] hover:bg-[#f5f9f5] transition-colors"
          >
            {answer.emoji && <span>{answer.emoji}</span>}
            {answer.label}
          </motion.button>
        ))}
      </div>

      {!showSlider && (
        <button
          type="button"
          onClick={() => setShowSlider(true)}
          className="text-sm text-[#7a9e7e] hover:underline"
        >
          Custom range →
        </button>
      )}

      {showSlider && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-5 rounded-2xl border border-[#e8e5de] bg-white space-y-5"
        >
          <p className="text-sm text-[#6b6b63]">Drag to set your comfortable range</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-[#9b9b90] mb-2">
                <span>Minimum</span>
                <span className="font-medium text-[#1a1a18]">Rs. {min.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={min}
                onChange={(e) => setMin(Math.min(Number(e.target.value), max - 500))}
                className="w-full accent-[#7a9e7e]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#9b9b90] mb-2">
                <span>Maximum</span>
                <span className="font-medium text-[#1a1a18]">Rs. {max.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={max}
                onChange={(e) => setMax(Math.max(Number(e.target.value), min + 500))}
                className="w-full accent-[#7a9e7e]"
              />
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRange(min, max)}
            className="w-full sage-gradient text-white font-semibold py-3.5 rounded-2xl text-sm"
          >
            Use Rs. {min.toLocaleString()} – {max.toLocaleString()}
          </motion.button>
        </motion.div>
      )}

      {somethingElse && !showSlider && (
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSomethingElse}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-[#e8e5de] text-sm text-[#6b6b63] hover:border-[#7a9e7e] hover:text-[#1a1a18] transition-colors"
        >
          <span>{somethingElse.emoji}</span>
          {somethingElse.label}
        </motion.button>
      )}
    </div>
  );
}
