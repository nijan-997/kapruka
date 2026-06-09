"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKapiStore } from "@/lib/store";
import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";

const isDebug = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

function Row({ label, value }: { label: string; value: unknown }) {
  const str =
    value === null || value === undefined
      ? "—"
      : typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : String(value);

  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-[#f0ede6] last:border-0">
      <span className="text-[10px] font-semibold text-[#9b9b90] uppercase tracking-widest">{label}</span>
      <pre className="text-xs text-[#1a1a18] whitespace-pre-wrap break-all font-mono leading-relaxed">{str}</pre>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="text-xs font-bold text-[#1a1a18] uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-[#9b9b90]" /> : <ChevronDown className="w-3 h-3 text-[#9b9b90]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const { profile, ai } = useKapiStore();

  if (!isDebug) return null;

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        id="debug-panel-toggle"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 bg-[#1a1a18] text-white text-xs font-mono rounded-xl shadow-lg"
        title="Debug Panel"
      >
        <Bug className="w-3.5 h-3.5" />
        <span>Debug</span>
        {ai.missingInformation.length > 0 && (
          <span className="bg-amber-400 text-[#1a1a18] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {ai.missingInformation.length}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white border-l border-[#e8e5de] overflow-y-auto"
              style={{ boxShadow: "-4px 0 24px rgba(26,26,24,0.08)" }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-[#e8e5de] px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-[#9b9b90]" />
                  <span className="text-xs font-bold text-[#1a1a18] tracking-wider uppercase">Kapi Debug</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#9b9b90] hover:text-[#1a1a18] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-3">
                {/* Status */}
                <div className="mb-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ai.isLoading ? "bg-amber-400 animate-pulse" : ai.error ? "bg-red-400" : "bg-[#7a9e7e]"}`} />
                  <span className="text-xs text-[#6b6b63]">
                    {ai.isLoading ? ai.loadingMessage || "Processing…" : ai.error ? "Error" : "Ready"}
                  </span>
                </div>

                {ai.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-mono">
                    {ai.error}
                  </div>
                )}

                {/* Shopping Profile */}
                <Section title="Shopping Profile">
                  <Row label="Type" value={profile.shoppingType} />
                  <Row label="Recipient" value={profile.recipient || profile.recipientCustom} />
                  <Row label="Occasion" value={profile.occasion || profile.occasionCustom} />
                  <Row label="Budget" value={profile.budget} />
                  <Row label="Budget Range" value={`${profile.budgetMin ?? "—"} – ${profile.budgetMax ?? "—"}`} />
                  <Row label="Delivery" value={profile.deliveryDate} />
                  <Row label="Interests" value={profile.interests} />
                  <Row label="Category" value={profile.category} />
                  <Row label="Language" value={profile.language} />
                  <Row label="NL Query" value={profile.naturalLanguageQuery} />
                  <Row label="Step" value={profile.step} />
                </Section>

                {/* Extracted Intent */}
                <Section title="Extracted Intent">
                  {ai.lastIntent ? (
                    <>
                      <Row label="Confidence" value={`${((ai.lastIntent.confidence ?? 0) * 100).toFixed(0)}%`} />
                      <Row label="Language Detected" value={ai.lastIntent.language} />
                      <Row label="Shopping Type" value={ai.lastIntent.shoppingType} />
                      <Row label="Recipient" value={ai.lastIntent.recipient} />
                      <Row label="Occasion" value={ai.lastIntent.occasion} />
                      <Row label="Budget" value={ai.lastIntent.budget} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No intent extracted yet.</p>
                  )}
                </Section>

                {/* Missing Information */}
                <Section title="Missing Information">
                  {ai.missingInformation.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 py-2">
                      {ai.missingInformation.map((f) => (
                        <span key={f} className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7a9e7e] py-2 flex items-center gap-1.5">
                      <span>✓</span> All required fields present
                    </p>
                  )}
                </Section>

                {/* Next Question */}
                <Section title="Next Question">
                  {ai.nextQuestion ? (
                    <>
                      <Row label="Field" value={ai.nextQuestion.field} />
                      <Row label="Question" value={ai.nextQuestion.question} />
                      <Row label="Type" value={ai.nextQuestion.type} />
                      <Row label="Required" value={String(ai.nextQuestion.isRequired)} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No question generated yet.</p>
                  )}
                </Section>

                {/* Search Strategy */}
                <Section title="Search Strategy">
                  {ai.searchStrategy ? (
                    <>
                      <Row label="Queries" value={ai.searchStrategy.queries} />
                      <Row label="Categories" value={ai.searchStrategy.categories} />
                      <Row label="Price Filter" value={ai.searchStrategy.priceFilter} />
                      <Row label="Sort By" value={ai.searchStrategy.sortBy} />
                      <Row label="Reasoning" value={ai.searchStrategy.reasoning} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No search strategy yet.</p>
                  )}
                </Section>

                {/* Recommendation Output */}
                <Section title="Recommendation Output">
                  {ai.ranking ? (
                    <>
                      <Row label="Total Considered" value={ai.ranking.totalConsidered} />
                      <Row label="Top Pick ID" value={ai.ranking.topPick?.productId} />
                      <Row label="Top Pick Score" value={ai.ranking.topPick?.matchScore} />
                      <Row label="Top Pick Reasons" value={ai.ranking.topPick?.reasons} />
                      <Row label="Most Loved" value={ai.ranking.mostLoved?.productId} />
                      <Row label="Unique Choice" value={ai.ranking.uniqueChoice?.productId} />
                      <Row label="Others Count" value={ai.ranking.others?.length} />
                      <Row label="Reasoning" value={ai.ranking.reasoning} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No recommendations yet.</p>
                  )}
                </Section>

                {/* Products Pool */}
                <Section title={`Products Pool (${ai.products.length})`}>
                  {ai.products.length > 0 ? (
                    <div className="space-y-1 py-1">
                      {ai.products.slice(0, 8).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1">
                          <span className="text-[#6b6b63] truncate max-w-[160px]">{p.name}</span>
                          <span className="text-[#9b9b90] flex-shrink-0 ml-2">Rs. {p.price.toLocaleString()}</span>
                        </div>
                      ))}
                      {ai.products.length > 8 && (
                        <p className="text-[10px] text-[#9b9b90]">+{ai.products.length - 8} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No products fetched yet.</p>
                  )}
                </Section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
