"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { JourneyStep } from "@/components/journey/JourneyStep";
import { BudgetPillsSlider } from "@/components/journey/BudgetPillsSlider";
import { useKapiStore } from "@/lib/store";
import { useVoiceInput } from "@/components/shared/useVoiceInput";
import {
  computeProfileConfidence,
  isReadyForRecommendations,
  progressLabel,
  CONFIDENCE_THRESHOLD,
} from "@/lib/confidence";
import { applyBudgetRange, applyPillAnswer } from "@/lib/profileUpdates";
import type { DynamicQuestion } from "@/lib/ai/generateQuestions";

interface ConciergeJourneyProps {
  mode: "gift" | "myself";
}

function QuestionLoading({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col items-center justify-center gap-4 px-6">
      <div className="relative flex items-center justify-center">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#7a9e7e]/10"
            style={{ width: 56 + i * 32, height: 56 + i * 32 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
        <Loader2 className="w-7 h-7 animate-spin text-[#7a9e7e] relative" />
      </div>
      <p className="text-sm text-[#6b6b63] text-center">{label}</p>
    </div>
  );
}

export function ConciergeJourney({ mode }: ConciergeJourneyProps) {
  const router = useRouter();
  const { profile, updateProfile, setNextQuestion } = useKapiStore();
  const [question, setQuestion] = useState<DynamicQuestion | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidence = computeProfileConfidence(profile);
  const loadingLabel = progressLabel(profile, questionCount);

  const finish = useCallback(() => {
    setFinishing(true);
    router.push("/loading-screen");
  }, [router]);

  const fetchQuestion = useCallback(async () => {
    setAwaitingNext(true);
    setError(null);
    const currentProfile = useKapiStore.getState().profile;
    try {
      const res = await fetch("/api/ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: currentProfile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to load question");

      if (data.personaPatch) {
        updateProfile(data.personaPatch);
      }

      if (data.ready || !data.question) {
        finish();
        return;
      }

      setQuestion(data.question);
      setNextQuestion(data.question);
      setQuestionCount((c) => c + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAwaitingNext(false);
      setLoading(false);
    }
  }, [finish, setNextQuestion, updateProfile]);

  useEffect(() => {
    updateProfile({ shoppingType: mode });
  }, [mode, updateProfile]);

  useEffect(() => {
    if (isReadyForRecommendations(profile)) {
      finish();
      return;
    }
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advanceAfterUpdate = useCallback(
    (patch: Parameters<typeof updateProfile>[0]) => {
      updateProfile(patch);
      const merged = useKapiStore.getState().profile;

      setShowCustom(false);
      setCustomText("");
      setQuestion(null);

      if (isReadyForRecommendations(merged)) {
        finish();
        return;
      }

      fetchQuestion();
    },
    [updateProfile, finish, fetchQuestion]
  );

  const handlePill = (answer: DynamicQuestion["predictedAnswers"][0]) => {
    if (answer.id === "something_else" || answer.value === "custom") {
      setShowCustom(true);
      return;
    }

    const patch = applyPillAnswer(profile, question!.field, answer);
    advanceAfterUpdate(patch);
  };

  const handleBudgetPreset = (id: string, label: string, value: string) => {
    const patch = applyPillAnswer(profile, "budget", { id, label, value });
    advanceAfterUpdate(patch);
  };

  const handleBudgetRange = (min: number, max: number) => {
    advanceAfterUpdate(applyBudgetRange(profile, min, max));
  };

  const handleCustomSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !question) return;

    setInterpreting(true);
    setAwaitingNext(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/interpret-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, field: question.field, answer: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Could not understand answer");

      advanceAfterUpdate(data.interpreted.profilePatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAwaitingNext(false);
    } finally {
      setInterpreting(false);
    }
  };

  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useVoiceInput(
    (text) => {
      setCustomText(text);
      handleCustomSubmit(text);
    }
  );

  const modeLabel = mode === "gift" ? "Buy For Someone" : "Buy For Myself";

  if (finishing) {
    return <QuestionLoading label="Finding the best match..." />;
  }

  if ((loading || awaitingNext || interpreting) && !question) {
    return <QuestionLoading label={loadingLabel} />;
  }

  if (!question) {
    return <QuestionLoading label={loadingLabel} />;
  }

  return (
    <AnimatePresence mode="wait">
      <JourneyStep
        key={question.field + question.question}
        progressLabel={loadingLabel}
        confidence={confidence}
        question={question.question}
        subtext={question.hint ?? undefined}
        onBack={() => (questionCount <= 1 ? router.push("/") : router.back())}
      >
        {awaitingNext || interpreting ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#7a9e7e]" />
            <p className="text-sm text-[#6b6b63]">Preparing your next question...</p>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {question.type === "budget" ? (
              <BudgetPillsSlider
                predictedAnswers={question.predictedAnswers}
                onSelectPreset={handleBudgetPreset}
                onSelectRange={handleBudgetRange}
                onSomethingElse={() => setShowCustom(true)}
              />
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {question.predictedAnswers
                  .filter((a) => a.id !== "something_else")
                  .map((answer) => (
                    <motion.button
                      key={answer.id}
                      type="button"
                      disabled={awaitingNext}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePill(answer)}
                      className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-[#e8e5de] bg-white text-sm font-medium text-[#1a1a18] hover:border-[#7a9e7e] hover:bg-[#f5f9f5] transition-all disabled:opacity-50"
                      style={{ boxShadow: "0 1px 3px rgba(26,26,24,0.04)" }}
                    >
                      {answer.emoji && <span className="text-lg">{answer.emoji}</span>}
                      {answer.label}
                    </motion.button>
                  ))}
              </div>
            )}

            {(showCustom || question.predictedAnswers.some((a) => a.id === "something_else")) && (
              <div className="mt-6 space-y-3">
                {!showCustom && question.type !== "budget" && (
                  <motion.button
                    type="button"
                    disabled={awaitingNext}
                    onClick={() => setShowCustom(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-[#e8e5de] text-sm text-[#6b6b63] hover:border-[#7a9e7e] transition-colors disabled:opacity-50"
                  >
                    ✨ Something Else
                  </motion.button>
                )}

                {showCustom && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl border border-[#e8e5de] bg-white space-y-3"
                  >
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Type your answer..."
                      disabled={interpreting || awaitingNext}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e5de] text-[#1a1a18] outline-none focus:border-[#7a9e7e] text-sm disabled:opacity-50"
                      onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit(customText)}
                    />
                    <div className="flex gap-2">
                      {isSupported && (
                        <button
                          type="button"
                          disabled={interpreting || awaitingNext}
                          onClick={isListening ? stopVoice : startVoice}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors disabled:opacity-50 ${
                            isListening
                              ? "border-red-200 bg-red-50 text-red-500"
                              : "border-[#e8e5de] text-[#6b6b63] hover:border-[#7a9e7e]"
                          }`}
                        >
                          <Mic className="w-4 h-4" />
                          {isListening ? "Listening..." : "Voice"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={interpreting || awaitingNext || !customText.trim()}
                        onClick={() => handleCustomSubmit(customText)}
                        className="flex-1 sage-gradient text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-40"
                      >
                        {interpreting ? "Understanding..." : "Continue"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <p className="mt-8 text-xs text-center text-[#9b9b90]">
              {modeLabel} · {confidence}% confident
              {confidence >= CONFIDENCE_THRESHOLD ? " · Ready to find matches" : ""}
            </p>
          </>
        )}
      </JourneyStep>
    </AnimatePresence>
  );
}
