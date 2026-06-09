"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/store";

const cards = [
  {
    type: "gift" as const,
    emoji: "🎁",
    title: "Find a Gift",
    subtitle: "For someone who deserves something special.",
    href: "/journey/gift",
    accent: "hover:border-[#d4785a]/30 hover:bg-[#fdf7f4]",
    dot: "bg-[#e8b49a]",
  },
  {
    type: "myself" as const,
    emoji: "🛍️",
    title: "Shop for Myself",
    subtitle: "Electronics, flowers, cakes, fashion and more.",
    href: "/journey/myself",
    accent: "hover:border-[#7a9e7e]/30 hover:bg-[#f5f9f5]",
    dot: "bg-[#a8c5ab]",
  },
  {
    type: "inspire" as const,
    emoji: "✨",
    title: "Inspire Me",
    subtitle: "Not sure yet? Let us spark some ideas.",
    href: "/journey/inspire",
    accent: "hover:border-[#c49a3c]/30 hover:bg-[#fdf9f0]",
    dot: "bg-[#e4c06e]",
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

  const handleSelect = (type: "gift" | "myself" | "inspire", href: string) => {
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
        Or start with a guided experience
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3"
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
              relative flex flex-col items-start p-4 rounded-2xl border border-[#e8e5de]
              bg-white text-left cursor-pointer transition-all duration-200
              ${card.accent}
              group
            `}
            style={{ boxShadow: "0 1px 3px rgba(26,26,24,0.04)" }}
          >
            <motion.span
              className="text-2xl mb-3 block"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2, ease: "easeInOut" }}
            >
              {card.emoji}
            </motion.span>
            <span className="font-semibold text-[#1a1a18] text-sm leading-tight block mb-1">
              {card.title}
            </span>
            <span className="text-[#9b9b90] text-xs leading-relaxed hidden md:block">
              {card.subtitle}
            </span>
            <div className={`mt-3 w-1.5 h-1.5 rounded-full ${card.dot} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
