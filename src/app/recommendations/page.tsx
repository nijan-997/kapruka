"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useKapiStore } from "@/lib/store";
import { Heart, ShoppingBag, RotateCcw, ArrowLeft, SlidersHorizontal, AlertCircle } from "lucide-react";

const trustChipColors: Record<string, string> = {
  "Matches Your Budget": "bg-green-50 text-green-700 border-green-100",
  "Available For Delivery": "bg-blue-50 text-blue-700 border-blue-100",
  "Matches Recipient": "bg-rose-50 text-rose-700 border-rose-100",
  "Recommended For Occasion": "bg-amber-50 text-amber-700 border-amber-100",
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.14, duration: 0.5, ease: "easeOut" },
  }),
};

// Build ordered list of ranked cards from the AI output
function useRankedCards() {
  const { ai } = useKapiStore();
  const { ranking, products } = ai;
  if (!ranking) return [];

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const cards = [];
  if (ranking.topPick) {
    const p = productMap[ranking.topPick.productId];
    if (p) cards.push({ ...ranking.topPick, product: p });
  }
  if (ranking.mostLoved) {
    const p = productMap[ranking.mostLoved.productId];
    if (p) cards.push({ ...ranking.mostLoved, product: p });
  }
  if (ranking.uniqueChoice) {
    const p = productMap[ranking.uniqueChoice.productId];
    if (p) cards.push({ ...ranking.uniqueChoice, product: p });
  }
  for (const other of ranking.others ?? []) {
    const p = productMap[other.productId];
    if (p) cards.push({ ...other, product: p });
  }
  return cards;
}

const BADGE_MAP: Record<string, string> = {
  best_pick: "🏆 My Top Pick",
  most_loved: "❤️ Most Loved",
  unique_choice: "✨ Unique Choice",
  other: "⭐ Great Match",
};

const TRUST_CHIPS_BY_VARIANT: Record<string, string[]> = {
  best_pick: ["Matches Your Budget", "Available For Delivery", "Matches Recipient"],
  most_loved: ["Matches Recipient", "Recommended For Occasion"],
  unique_choice: ["Matches Your Budget", "Matches Recipient"],
  other: ["Matches Your Budget"],
};

export default function RecommendationsPage() {
  const router = useRouter();
  const { profile, ai, reset } = useKapiStore();
  const rankedCards = useRankedCards();
  const hasResults = rankedCards.length > 0;

  const recipientLabel = profile.recipientCustom || profile.recipient || "someone special";
  const occasionLabel = profile.occasionCustom || profile.occasion?.replace(/_/g, " ") || "a special occasion";

  const primaryCards = rankedCards.slice(0, 3);
  const otherCards = rankedCards.slice(3);

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      <div className="max-w-xl mx-auto px-5 py-6 pb-20">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} id="recs-back"
            className="flex items-center gap-2 text-[#9b9b90] hover:text-[#1a1a18] p-2 -ml-2 rounded-xl hover:bg-[#f5f3ee] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Refine</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="text-[#9b9b90] hover:text-[#1a1a18] p-2 rounded-xl hover:bg-[#f5f3ee] transition-colors" aria-label="Filter">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button onClick={() => { reset(); router.push("/"); }} id="recs-start-over"
              className="flex items-center gap-1.5 text-[#9b9b90] hover:text-[#1a1a18] p-2 rounded-xl hover:bg-[#f5f3ee] transition-colors text-sm">
              <RotateCcw className="w-3.5 h-3.5" />
              Start over
            </button>
          </div>
        </div>

        {/* AI Error state */}
        {ai.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">AI unavailable</p>
              <p className="text-xs text-amber-600 mt-0.5">Showing curated suggestions instead.</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6">
          <p className="text-xs font-medium text-[#9b9b90] uppercase tracking-widest mb-3 capitalize">
            {profile.recipient && `For ${recipientLabel}`}
            {profile.occasion && ` · ${occasionLabel}`}
            {profile.budget && ` · ${profile.budget}`}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[#1a1a18] leading-tight">
            {hasResults
              ? `I found ${ai.products.length} options and these stand out.`
              : "I found a few options that stand out."}
          </h1>
          {ai.ranking?.reasoning && (
            <p className="mt-2 text-[#6b6b63] text-sm leading-relaxed">{ai.ranking.reasoning}</p>
          )}
        </motion.div>

        {/* Trust tags */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-8">
          {["Curated for you", "Delivery confirmed", "Within your budget"].map((tag) => (
            <span key={tag} className="text-xs text-[#7a9e7e] px-3 py-1 bg-[#f0f5f0] rounded-full border border-[#c8deca]">
              ✦ {tag}
            </span>
          ))}
        </motion.div>

        {/* Primary recommendation cards */}
        <div className="space-y-4">
          {(hasResults ? primaryCards : [{ variant: "best_pick", product: null, reasons: [], matchScore: 0 },
            { variant: "most_loved", product: null, reasons: [], matchScore: 0 },
            { variant: "unique_choice", product: null, reasons: [], matchScore: 0 }]
          ).map((card, i) => {
            const isHero = card.variant === "best_pick";
            const product = "product" in card ? card.product : null;

            return (
              <motion.div key={`${card.variant}-${i}`} custom={i} variants={cardVariants}
                initial="hidden" animate="visible" id={`rec-${card.variant}`}
                className="bg-white rounded-3xl border border-[#e8e5de] overflow-hidden"
                style={{ boxShadow: isHero ? "0 4px 24px rgba(26,26,24,0.08)" : "0 1px 4px rgba(26,26,24,0.05)" }}>

                <div className={`relative ${isHero ? "h-52" : "h-36"} bg-[#f5f3ee] flex items-center justify-center overflow-hidden`}>
                  {product?.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 576px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#e8e5de] mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl opacity-40">🎁</span>
                      </div>
                      <p className="text-xs text-[#9b9b90]">{product ? product.name.slice(0, 28) : "Product image"}</p>
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#e8e5de] text-[#1a1a18] shadow-sm">
                      {BADGE_MAP[card.variant] ?? "⭐ Match"}
                    </span>
                  </div>

                  {/* Match score */}
                  {card.matchScore > 0 && (
                    <div className="absolute top-3 right-12">
                      <span className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-[#f0f5f0] border border-[#c8deca] text-[#5a7d5e]">
                        {card.matchScore}% match
                      </span>
                    </div>
                  )}

                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full border border-[#e8e5de] flex items-center justify-center text-[#9b9b90] hover:text-rose-400 transition-colors shadow-sm" aria-label="Save">
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#1a1a18] leading-snug">
                        {product?.name ?? "Curated just for you"}
                      </h3>
                      <p className="text-[#9b9b90] text-sm mt-0.5">
                        {product ? `Rs. ${product.price.toLocaleString()}` : "Rs. 3,000 – 6,000"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs font-medium text-[#7a9e7e] bg-[#f0f5f0] px-2.5 py-1 rounded-full border border-[#c8deca]">
                        {product?.inStock || product?.availableToday ? "In stock" : product?.availableTomorrow ? "Tomorrow" : "Available"}
                      </span>
                    </div>
                  </div>

                  {/* AI Reasons */}
                  <div className="bg-[#fafaf7] border border-[#e8e5de] rounded-2xl p-3.5 mb-4">
                    <p className="text-xs text-[#9b9b90] uppercase tracking-widest mb-2">Why I picked this</p>
                    {card.reasons && card.reasons.length > 0 ? (
                      <ul className="space-y-1">
                        {card.reasons.map((r: string, j: number) => (
                          <li key={j} className="text-xs text-[#6b6b63] flex items-start gap-1.5">
                            <span className="text-[#a8c5ab] mt-0.5 flex-shrink-0">✦</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-[#e8e5de] rounded-full w-full" />
                        <div className="h-2.5 bg-[#e8e5de] rounded-full w-4/5" />
                        <div className="h-2.5 bg-[#e8e5de] rounded-full w-3/5" />
                      </div>
                    )}
                  </div>

                  {/* Trust chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(TRUST_CHIPS_BY_VARIANT[card.variant] ?? []).map((chip: string) => (
                      <span key={chip}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${trustChipColors[chip] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                        ✓ {chip}
                      </span>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/checkout")}
                      id={`order-${card.variant}`}
                      className="flex-1 sage-gradient text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2"
                      style={{ boxShadow: "0 3px 16px rgba(122,158,126,0.3)" }}>
                      <ShoppingBag className="w-4 h-4" />
                      {isHero ? "Order This" : "Choose This"}
                    </motion.button>
                    <motion.a
                      href={product?.url ?? "#"}
                      target={product?.url ? "_blank" : undefined}
                      rel={product?.url ? "noreferrer" : undefined}
                      whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                      className={`px-4 py-3 bg-white border border-[#e8e5de] rounded-2xl text-sm transition-all ${
                        product?.url
                          ? "hover:border-[#a8c5ab] text-[#6b6b63] hover:text-[#1a1a18]"
                          : "pointer-events-none text-[#c8c5bd]"
                      }`}>
                      Details
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Other matching options grid */}
        {otherCards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6">
            <h2 className="font-display text-lg font-semibold text-[#1a1a18] mb-4">Other Matching Options</h2>
            <div className="grid grid-cols-2 gap-3">
              {otherCards.map((card, i) => {
                const product = "product" in card ? card.product : null;
                return (
                  <motion.button key={i}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.08 }}
                    onClick={() => router.push("/checkout")}
                    className="bg-white rounded-2xl border border-[#e8e5de] p-4 cursor-pointer hover:border-[#a8c5ab] transition-colors text-left"
                    style={{ boxShadow: "0 1px 3px rgba(26,26,24,0.04)" }}>
                    <div className="relative h-24 bg-[#f5f3ee] rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {product?.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 260px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xl opacity-40">🎁</span>
                      )}
                    </div>
                    {product ? (
                      <>
                        <p className="text-xs font-medium text-[#1a1a18] leading-tight line-clamp-2 mb-1">{product.name}</p>
                        <p className="text-xs text-[#9b9b90]">Rs. {product.price.toLocaleString()}</p>
                      </>
                    ) : (
                      <>
                        <div className="h-2 bg-[#e8e5de] rounded-full w-4/5 mb-1.5" />
                        <div className="h-2 bg-[#e8e5de] rounded-full w-2/5" />
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="text-center text-[#9b9b90] text-xs mt-10">
          Not quite right?{" "}
          <button onClick={() => router.back()} className="text-[#7a9e7e] hover:underline transition-colors">
            Adjust your preferences
          </button>
        </motion.p>
      </div>
    </div>
  );
}
