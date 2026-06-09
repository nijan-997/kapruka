"use client";

import { motion } from "framer-motion";

interface OptionCardProps {
  id: string;
  emoji?: string;
  label: string;
  sublabel?: string;
  selected?: boolean;
  special?: boolean;
  onClick: () => void;
}

export function OptionCard({
  id,
  emoji,
  label,
  sublabel,
  selected,
  special,
  onClick,
}: OptionCardProps) {
  return (
    <motion.button
      id={id}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={selected}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl border text-left
        transition-all duration-200 group
        ${selected
          ? "border-[#7a9e7e] bg-[#f0f5f0] shadow-[0_0_0_3px_rgba(122,158,126,0.15)]"
          : special
          ? "border-[#e8e5de] bg-white hover:border-[#c49a3c]/40 hover:bg-[#fdf9f0]"
          : "border-[#e8e5de] bg-white hover:border-[#a8c5ab] hover:bg-[#f5f9f5]"
        }
      `}
      style={{ boxShadow: selected ? undefined : "0 1px 3px rgba(26,26,24,0.04)" }}
    >
      {emoji && (
        <span className="text-2xl flex-shrink-0 leading-none">{emoji}</span>
      )}

      <div className="flex-1 min-w-0">
        <span className={`font-medium text-sm leading-tight block ${
          special ? "text-[#c49a3c]" : selected ? "text-[#1a1a18]" : "text-[#1a1a18]"
        }`}>
          {special && <span className="mr-1">✨</span>}
          {label}
        </span>
        {sublabel && (
          <span className="text-[#9b9b90] text-xs mt-0.5 block">{sublabel}</span>
        )}
      </div>

      {/* Selection indicator */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        selected ? "border-[#7a9e7e] bg-[#7a9e7e]" : "border-[#e8e5de] group-hover:border-[#a8c5ab]"
      }`}>
        {selected && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 10 10"
          >
            <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </div>
    </motion.button>
  );
}
