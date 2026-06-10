"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKapiStore } from "@/lib/store";
import {
  buildRecipientPersona,
  personaAgeGroupLabel,
  personaGenderLabel,
} from "@/lib/persona/recipientPersona";
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
  const { profile, ai, recommendations } = useKapiStore();
  const persona = buildRecipientPersona(profile);

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

                {/* Recipient Persona */}
                <Section title="Recipient Persona">
                  {profile.shoppingType === "gift" ? (
                    <>
                      <Row
                        label="Persona"
                        value={{
                          recipient: persona.recipient || profile.recipientCustom || "—",
                          gender: persona.gender
                            ? personaGenderLabel(persona.gender)
                            : "—",
                          ageGroup: persona.ageGroup
                            ? personaAgeGroupLabel(persona.ageGroup)
                            : "—",
                          relationshipStrength: persona.relationshipStrength,
                          confidence: persona.confidence,
                        }}
                      />
                      <Row label="Gender Confidence" value={`${persona.genderConfidence}%`} />
                      <Row label="Age Group Confidence" value={`${persona.ageGroupConfidence}%`} />
                      <Row label="Gender Inferred" value={persona.genderInferred ? "Yes" : "No"} />
                      <Row label="Age Inferred" value={persona.ageGroupInferred ? "Yes" : "No"} />
                      <Row label="Profile Gender" value={profile.gender || "—"} />
                      <Row label="Profile Age Group" value={profile.ageGroup || "—"} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">Persona applies to gift mode only.</p>
                  )}
                </Section>

                {/* Shopping Profile */}
                <Section title="Shopping Profile">
                  <Row label="Type" value={profile.shoppingType} />
                  <Row label="Recipient" value={profile.recipient || profile.recipientCustom} />
                  <Row label="Gender" value={profile.gender} />
                  <Row label="Age Group" value={profile.ageGroup} />
                  <Row label="Occasion" value={profile.occasion || profile.occasionCustom} />
                  <Row label="Budget" value={profile.budget} />
                  <Row label="Budget Range" value={`${profile.budgetMin ?? "—"} – ${profile.budgetMax ?? "—"}`} />
                  <Row label="Delivery" value={profile.deliveryDate} />
                  <Row label="Interests" value={profile.interests} />
                  <Row label="Category" value={profile.category} />
                  <Row label="Language" value={profile.language} />
                  <Row label="NL Query" value={profile.naturalLanguageQuery} />
                  <Row label="Emotional Goal" value={profile.emotionalGoal} />
                  <Row label="Goal" value={profile.goal} />
                  <Row label="Priority" value={profile.priority} />
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
                      <Row label="Confidence" value={`${ai.nextQuestion.confidence}%`} />
                      <Row
                        label="Pills"
                        value={ai.nextQuestion.predictedAnswers?.map((a) => a.label)}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No question generated yet.</p>
                  )}
                </Section>

                {/* Gift Strategy */}
                <Section title="Gift Strategy">
                  {ai.giftStrategy || ai.retrievalDebug?.giftStrategy ? (
                    <>
                      <Row
                        label="Strategy"
                        value={ai.giftStrategy?.strategy ?? ai.retrievalDebug?.giftStrategy}
                      />
                      <Row
                        label="Label"
                        value={ai.giftStrategy?.label ?? ai.retrievalDebug?.giftStrategyLabel}
                      />
                      <Row
                        label="Hero Required"
                        value={ai.giftStrategy?.heroGiftRequired ?? "—"}
                      />
                      <Row
                        label="Supporting Allowed"
                        value={ai.giftStrategy?.supportingGiftAllowed ?? "—"}
                      />
                      <Row
                        label="Emotional Priority"
                        value={ai.giftStrategy?.emotionalPriority ?? "—"}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No gift strategy yet.</p>
                  )}
                </Section>

                {/* Search Strategy */}
                <Section title="Search Strategy">
                  {ai.searchStrategy ? (
                    <>
                      <Row label="Hero Queries" value={ai.searchStrategy.heroQueries} />
                      <Row label="Supporting Queries" value={ai.searchStrategy.supportingQueries} />
                      <Row label="All Queries" value={ai.searchStrategy.queries} />
                      <Row label="Categories" value={ai.searchStrategy.categories} />
                      <Row label="Price Filter" value={ai.searchStrategy.priceFilter} />
                      <Row label="Sort By" value={ai.searchStrategy.sortBy} />
                      <Row label="Reasoning" value={ai.searchStrategy.reasoning} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No search strategy yet.</p>
                  )}
                </Section>

                {/* Retrieval Pipeline */}
                <Section title="Retrieval Pipeline">
                  {ai.retrievalDebug ? (
                    <>
                      <Row label="Generated Queries" value={ai.retrievalDebug.generatedQueries} />
                      <Row
                        label="Products Per Query"
                        value={ai.retrievalDebug.productsPerQuery.map(
                          (q) => `${q.query}: ${q.count}`
                        )}
                      />
                      <Row label="Merged Count" value={ai.retrievalDebug.mergedCount} />
                      <Row label="Deduplicated Count" value={ai.retrievalDebug.deduplicatedCount} />
                      <Row label="Filtered Count" value={ai.retrievalDebug.filteredCount} />
                      <Row label="Rejected Count" value={ai.retrievalDebug.rejectedCount} />
                      <Row label="Final Candidates" value={ai.retrievalDebug.finalCandidateCount} />
                      <Row label="Hero Gift Count" value={ai.retrievalDebug.heroGiftCount} />
                      <Row label="Supporting Gift Count" value={ai.retrievalDebug.supportingGiftCount} />
                      <Row label="Early Stop" value={ai.retrievalDebug.earlyStopTriggered ? "Yes" : "No"} />
                      {ai.retrievalDebug.compatibilityRejections?.length > 0 && (
                        <Row
                          label="Compatibility Rejections"
                          value={ai.retrievalDebug.compatibilityRejections.map(
                            (r) => `${r.product.name} — ${r.reason}`
                          )}
                        />
                      )}
                      {ai.retrievalDebug.keywordRejections.length > 0 && (
                        <Row
                          label="Keyword Rejections"
                          value={ai.retrievalDebug.keywordRejections.map(
                            (r) => `${r.product.name} — ${r.reason}`
                          )}
                        />
                      )}
                      {ai.retrievalDebug.budgetRejections.length > 0 && (
                        <Row
                          label="Budget Rejections"
                          value={ai.retrievalDebug.budgetRejections.map(
                            (r) => `${r.product.name} — ${r.reason}`
                          )}
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No retrieval data yet.</p>
                  )}
                </Section>

                {/* Performance Timings */}
                <Section title="Performance Timings">
                  {ai.performanceTimings ? (
                    <>
                      <Row label="Search Strategy" value={`${ai.performanceTimings.searchStrategyMs ?? "—"} ms`} />
                      <Row label="MCP Retrieval" value={`${ai.performanceTimings.mcpRetrievalMs} ms`} />
                      <Row label="Merge" value={`${ai.performanceTimings.mergeMs} ms`} />
                      <Row label="Deduplication" value={`${ai.performanceTimings.deduplicationMs} ms`} />
                      <Row label="Filtering" value={`${ai.performanceTimings.filteringMs} ms`} />
                      <Row label="Scoring" value={`${ai.performanceTimings.scoringMs} ms`} />
                      <Row label="Explanation Generation" value={`${ai.performanceTimings.explanationMs ?? "—"} ms`} />
                      <Row label="Total" value={`${ai.performanceTimings.totalMs ?? "—"} ms`} />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No timing data yet.</p>
                  )}
                </Section>

                {/* Deterministic Scores */}
                <Section title="Deterministic Scores">
                  {ai.deterministicScores.length > 0 ? (
                    <div className="space-y-2 py-1">
                      {ai.deterministicScores.map((s) => {
                        const product = ai.products.find((p) => p.id === s.productId);
                        const name =
                          product?.name ??
                          ai.retrievalDebug?.keywordRejections.find(
                            (r) => r.product.id === s.productId
                          )?.product.name ??
                          s.productId;
                        return (
                          <div
                            key={s.productId}
                            className={`text-xs py-1.5 px-2 rounded-lg border ${
                              !s.accepted
                                ? "bg-red-50 border-red-100 text-red-700"
                                : "bg-green-50 border-green-100 text-green-800"
                            }`}
                          >
                            <div className="font-medium truncate">{name}</div>
                            <div className="mt-0.5">
                              Score: {s.score} · {s.accepted ? "Accepted" : "Rejected"}
                              {"giftType" in s && s.giftType ? ` · ${s.giftType}` : ""}
                            </div>
                            <div className="mt-0.5 text-[10px] opacity-80">
                              {Object.entries(s.breakdown)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No scores yet.</p>
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

                {/* Browse Expansion */}
                <Section title="Browse Expansion">
                  {recommendations.sessions.length > 0 ? (
                    <>
                      <Row label="Sessions" value={recommendations.sessions.length} />
                      <Row label="Page Size" value={recommendations.pageSize} />
                      <Row label="Displayed Count" value={recommendations.displayedCount} />
                      <Row label="Seen Product IDs" value={recommendations.seenProductIds.length} />
                      <Row label="Total Retrieved" value={recommendations.analytics.totalRetrieved} />
                      <Row label="Total Displayed" value={recommendations.analytics.totalDisplayed} />
                      <Row label="Remaining Count" value={recommendations.analytics.remainingCount} />
                      <Row label="Load More Clicks" value={recommendations.analytics.loadMoreClicks} />
                      <Row
                        label="Explore Clicks"
                        value={recommendations.analytics.exploreDifferentIdeasClicks}
                      />
                      <Row
                        label="Session Types"
                        value={recommendations.sessions.map((s) => `${s.type} (${s.allRecommendations.length})`)}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-[#9b9b90] py-2">No browse session yet.</p>
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
