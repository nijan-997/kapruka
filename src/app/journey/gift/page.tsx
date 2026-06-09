"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { JourneyStep } from "@/components/journey/JourneyStep";
import { OptionCard } from "@/components/journey/OptionCard";
import { BudgetSelector } from "@/components/journey/BudgetSelector";
import { PersonaChips } from "@/components/journey/PersonaChips";
import { TellMeMoreSheet } from "@/components/journey/TellMeMoreSheet";
import { useProfileStore } from "@/lib/store";
import { recipients, occasions, deliveryOptions } from "@/lib/data";

export default function GiftJourneyPage() {
  const router = useRouter();
  const { profile, updateProfile, toggleInterest } = useProfileStore();
  const [step, setStep] = useState(1);
  const [showRecipientSheet, setShowRecipientSheet] = useState(false);
  const [showOccasionSheet, setShowOccasionSheet] = useState(false);
  const TOTAL = 5;

  const next = () => setStep((s) => s + 1);
  const back = () => (step === 1 ? router.push("/") : setStep((s) => s - 1));

  const selectRecipient = (id: string) => {
    updateProfile({ recipient: id });
    setTimeout(next, 300);
  };

  const selectOccasion = (id: string) => {
    updateProfile({ occasion: id });
    setTimeout(next, 300);
  };

  const selectBudget = (id: string, min: number | null, max: number | null) => {
    updateProfile({ budget: id, budgetMin: min, budgetMax: max });
    setTimeout(next, 300);
  };

  const selectDelivery = (id: string) => {
    updateProfile({ deliveryDate: id });
    setTimeout(next, 300);
  };

  const handleFinish = () => router.push("/loading-screen");

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <JourneyStep key="s1" stepNumber={1} totalSteps={TOTAL} onBack={back}
            question="Who are you shopping for?"
            subtext="We'll tailor every recommendation to them.">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {recipients.map((r) => (
                <OptionCard key={r.id} id={`r-${r.id}`} emoji={r.emoji} label={r.label}
                  sublabel={r.sublabel} selected={profile.recipient === r.id}
                  onClick={() => selectRecipient(r.id)} />
              ))}
              <OptionCard id="r-someone-else" label={profile.recipientCustom || "Someone Else"}
                sublabel="A boss, teacher, grandparent…" special
                selected={!!profile.recipientCustom && !recipients.find(r => r.id === profile.recipient)}
                onClick={() => setShowRecipientSheet(true)} />
            </div>
          </JourneyStep>
        )}

        {step === 2 && (
          <JourneyStep key="s2" stepNumber={2} totalSteps={TOTAL} onBack={back}
            question="What's the occasion?"
            subtext="This helps us find the most fitting options.">
            <div className="grid grid-cols-2 gap-2.5">
              {occasions.map((o) => (
                <OptionCard key={o.id} id={`o-${o.id}`} emoji={o.emoji} label={o.label}
                  selected={profile.occasion === o.id}
                  onClick={() => selectOccasion(o.id)} />
              ))}
              <OptionCard id="o-other" label={profile.occasionCustom || "Something Else"}
                special selected={!!profile.occasionCustom}
                onClick={() => setShowOccasionSheet(true)} />
            </div>
          </JourneyStep>
        )}

        {step === 3 && (
          <JourneyStep key="s3" stepNumber={3} totalSteps={TOTAL} onBack={back}
            question="What's your budget?"
            subtext="We'll only show options that fit comfortably.">
            <BudgetSelector selected={profile.budget} onSelect={selectBudget} />
          </JourneyStep>
        )}

        {step === 4 && (
          <JourneyStep key="s4" stepNumber={4} totalSteps={TOTAL} onBack={back}
            question="When do you need it?"
            subtext="We'll prioritise what's available in time.">
            <div className="grid grid-cols-2 gap-2.5">
              {deliveryOptions.map((d) => (
                <OptionCard key={d.id} id={`d-${d.id}`} emoji={d.emoji} label={d.label}
                  sublabel={d.sublabel} selected={profile.deliveryDate === d.id}
                  onClick={() => selectDelivery(d.id)} />
              ))}
              <OptionCard id="d-specific" emoji="📌" label="A specific date" special
                onClick={() => selectDelivery("specific")} />
            </div>
          </JourneyStep>
        )}

        {step === 5 && (
          <JourneyStep key="s5" stepNumber={5} totalSteps={TOTAL} onBack={back}
            question="What's this person like?"
            subtext="Choose anything that resonates. This shapes our curation.">
            <div className="space-y-6">
              <PersonaChips selected={profile.interests} onToggle={toggleInterest} />

              <motion.button
                onClick={handleFinish}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                id="gift-find-button"
                className="w-full sage-gradient text-white font-semibold py-4 rounded-2xl text-base mt-2"
                style={{ boxShadow: "0 4px 20px rgba(122,158,126,0.3)" }}
              >
                Find Perfect Gifts →
              </motion.button>

              {profile.interests.length === 0 && (
                <p className="text-center text-[#9b9b90] text-sm">
                  You can skip this step if you&apos;d like
                </p>
              )}
            </div>
          </JourneyStep>
        )}
      </AnimatePresence>

      {/* Sheets */}
      <TellMeMoreSheet isOpen={showRecipientSheet} onClose={() => setShowRecipientSheet(false)}
        onSelect={(v) => { updateProfile({ recipientCustom: v, recipient: "custom" }); setShowRecipientSheet(false); setTimeout(next, 300); }} />
      <TellMeMoreSheet isOpen={showOccasionSheet} onClose={() => setShowOccasionSheet(false)}
        title="What's the occasion?"
        suggestions={[
          { emoji: "🎊", label: "Promotion" }, { emoji: "💐", label: "Get Well Soon" },
          { emoji: "🎉", label: "Surprise Party" }, { emoji: "🙏", label: "Farewell" },
          { emoji: "🌟", label: "Achievement" }, { emoji: "💝", label: "Valentine's Day" },
          { emoji: "🎄", label: "Christmas" }, { emoji: "🪔", label: "Deepawali" },
        ]}
        onSelect={(v) => { updateProfile({ occasionCustom: v, occasion: "other" }); setShowOccasionSheet(false); setTimeout(next, 300); }} />
    </div>
  );
}
