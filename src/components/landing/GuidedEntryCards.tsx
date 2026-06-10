"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/store";

const cards = [
  {
    type: "gift" as const,
    emoji: "🎁",
    title: "Buy For Someone",
    subtitle: "Find something they'll genuinely love.",
    href: "/journey/gift",
    accent: "hover:border-[#d4785a]/30 hover:bg-[#fdf7f4]",
    dot: "bg-[#e8b49a]",
    floatDelay: 0.15,
  },
  {
    type: "myself" as const,
    emoji: "🛍️",
    title: "Buy For Myself",
    subtitle: "Get exactly what you need, confidently.",
    href: "/journey/myself",
    accent: "hover:border-[#7a9e7e]/30 hover:bg-[#f5f9f5]",
    dot: "bg-[#a8c5ab]",
    floatDelay: 0.85,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function GuidedEntryCards() {
  const router = useRouter();
  const { updateProfile, reset } = useProfileStore();

  const handleSelect = (type: "gift" | "myself", href: string) => {
    reset();
    updateProfile({ shoppingType: type });
    router.push(href);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-5">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-[#9b9b90] mb-5 tracking-wide"
      >
        Or choose how you&apos;re shopping
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 max-w-lg mx-auto"
      >
        {cards.map((card) => (
          <motion.button
            key={card.type}
            variants={cardVariants}
            onClick={() => handleSelect(card.type, card.href)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            id={`entry-${card.type}`}
            className={`
              relative flex flex-col items-start p-5 rounded-2xl border border-[#e8e5de]
              bg-white text-left cursor-pointer transition-all duration-200
              ${card.accent}
              group
            `}
            style={{ boxShadow: "0 1px 3px rgba(26,26,24,0.04)" }}
          >
            <motion.span
              className="text-3xl mb-3 block"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: card.floatDelay, ease: "easeInOut" }}
            >
              {card.emoji}
            </motion.span>
            <span className="font-semibold text-[#1a1a18] text-base leading-tight block mb-1.5">
              {card.title}
            </span>
            <span className="text-[#9b9b90] text-xs leading-relaxed">
              {card.subtitle}
            </span>
            <div className={`mt-3 w-1.5 h-1.5 rounded-full ${card.dot} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
