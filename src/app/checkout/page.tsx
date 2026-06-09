"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

type Step = "recipient" | "address" | "delivery" | "message" | "payment";

const steps: Array<{ id: Step; label: string }> = [
  { id: "recipient", label: "Recipient" },
  { id: "address", label: "Address" },
  { id: "delivery", label: "Delivery" },
  { id: "message", label: "Message" },
  { id: "payment", label: "Payment" },
];

export default function CheckoutPage() {
  const [current, setCurrent] = useState<Step>("recipient");
  const [completed, setCompleted] = useState<Step[]>([]);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const currentIndex = steps.findIndex((s) => s.id === current);

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) {
      setCompleted((c) => [...c, current]);
      setCurrent(next.id);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex flex-col items-center justify-center px-5">
        <div className="h-0.5 fixed top-0 left-0 right-0" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-sm mx-auto"
        >
          {/* Success circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f0f5f0] border-2 border-[#7a9e7e] flex items-center justify-center"
          >
            <Check className="w-9 h-9 text-[#7a9e7e]" strokeWidth={2.5} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h2 className="font-display text-3xl font-semibold text-[#1a1a18] mb-2">Order placed.</h2>
            <p className="text-[#6b6b63] text-base leading-relaxed mb-1">
              Your gift is on its way. We&apos;ll keep you updated.
            </p>
            <p className="text-[#7a9e7e] font-medium text-sm mb-8">
              🚚 Estimated arrival: Tomorrow by 6 PM
            </p>

            {/* Order summary card */}
            <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 mb-6 text-left"
              style={{ boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <p className="text-[#9b9b90] text-xs uppercase tracking-widest mb-3">Your order</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#f5f3ee] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎁</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a18]">Your selected gift</p>
                  <p className="text-[#9b9b90] text-xs mt-0.5">Standard delivery · Rs. 350</p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              id="success-done"
              className="w-full sage-gradient text-white font-semibold py-4 rounded-2xl text-base"
              style={{ boxShadow: "0 4px 16px rgba(122,158,126,0.3)" }}
            >
              Done ✨
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #7a9e7e, #a8c5ab, #e8b49a)" }} />

      <div className="max-w-xl mx-auto w-full px-5 py-6 flex-1 flex flex-col">
        {/* Nav */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-[#9b9b90] hover:text-[#1a1a18] p-2 -ml-2 rounded-xl hover:bg-[#f5f3ee] transition-colors" id="checkout-back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-xl font-semibold text-[#1a1a18]">Checkout</h1>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {steps.map((step, i) => {
            const isComplete = completed.includes(step.id);
            const isCurrent = current === step.id;
            return (
              <div key={step.id} className="flex items-center gap-1">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isComplete ? "bg-[#f0f5f0] text-[#5a7d5e] border border-[#c8deca]"
                  : isCurrent ? "bg-[#7a9e7e] text-white"
                  : "bg-[#f5f3ee] text-[#9b9b90] border border-[#e8e5de]"
                }`}>
                  {isComplete && <Check className="w-3 h-3" />}
                  {step.label}
                </span>
                {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-[#e8e5de] flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28 }}>
              {current === "recipient" && <RecipientStep />}
              {current === "address" && <AddressStep />}
              {current === "delivery" && <DeliveryStep />}
              {current === "message" && <MessageStep />}
              {current === "payment" && <PaymentStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.button
          onClick={goNext}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          id="checkout-continue"
          className="w-full mt-6 sage-gradient text-white font-semibold py-4 rounded-2xl text-base"
          style={{ boxShadow: "0 4px 16px rgba(122,158,126,0.3)" }}
        >
          {currentIndex === steps.length - 1 ? "Place Order 🌿" : "Continue →"}
        </motion.button>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", id }: { label: string; placeholder: string; type?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#6b6b63] mb-1.5">{label}</label>
      <input type={type} id={id} placeholder={placeholder}
        className="w-full bg-white border border-[#e8e5de] rounded-xl px-4 py-3 text-[#1a1a18] placeholder-[#9b9b90] outline-none focus:border-[#7a9e7e] transition-colors text-sm"
        style={{ boxShadow: "0 1px 2px rgba(26,26,24,0.04)" }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-semibold text-[#1a1a18] mb-5">{children}</h2>;
}

function RecipientStep() {
  return (
    <div className="space-y-4">
      <SectionTitle>Who&apos;s receiving this?</SectionTitle>
      <Field label="Recipient Name" placeholder="e.g. Amma" id="r-name" />
      <Field label="Phone Number" placeholder="+94 77 000 0000" type="tel" id="r-phone" />
    </div>
  );
}

function AddressStep() {
  return (
    <div className="space-y-4">
      <SectionTitle>Where should we deliver?</SectionTitle>
      <Field label="Address" placeholder="No. 25, Galle Road" id="a-line1" />
      <Field label="City" placeholder="Colombo" id="a-city" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="District" placeholder="Western" id="a-district" />
        <Field label="Postal Code" placeholder="00300" id="a-postal" />
      </div>
    </div>
  );
}

function DeliveryStep() {
  const [sel, setSel] = useState("standard");
  const opts = [
    { id: "express", label: "Express", sub: "Today by 8 PM", price: "Rs. 750", badge: "⚡ Fastest" },
    { id: "standard", label: "Standard", sub: "Tomorrow by 6 PM", price: "Rs. 350", badge: "🌿 Popular" },
    { id: "scheduled", label: "Scheduled", sub: "Choose a date", price: "Rs. 450", badge: "📅 Flexible" },
  ];
  return (
    <div className="space-y-3">
      <SectionTitle>How would you like it delivered?</SectionTitle>
      {opts.map((o) => (
        <button key={o.id} onClick={() => setSel(o.id)} id={`delivery-${o.id}`}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
            sel === o.id ? "border-[#7a9e7e] bg-[#f0f5f0] shadow-[0_0_0_3px_rgba(122,158,126,0.12)]" : "border-[#e8e5de] bg-white hover:border-[#a8c5ab]"
          }`} style={{ boxShadow: sel === o.id ? undefined : "0 1px 3px rgba(26,26,24,0.04)" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm text-[#1a1a18]">{o.label}</span>
              <span className="text-xs text-[#9b9b90] px-2 py-0.5 bg-[#f5f3ee] rounded-full border border-[#e8e5de]">{o.badge}</span>
            </div>
            <span className="text-xs text-[#9b9b90]">{o.sub}</span>
          </div>
          <span className={`font-semibold text-sm flex-shrink-0 ${sel === o.id ? "text-[#5a7d5e]" : "text-[#6b6b63]"}`}>{o.price}</span>
        </button>
      ))}
    </div>
  );
}

function MessageStep() {
  const [to, setTo] = useState("Amma");
  const [from, setFrom] = useState("Your loving child");
  const [msg, setMsg] = useState("Wishing you a beautiful day filled with love and warmth. ❤️");

  return (
    <div className="space-y-4">
      <SectionTitle>Add a personal message</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#6b6b63] mb-1.5">To</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} id="msg-to"
            className="w-full bg-white border border-[#e8e5de] rounded-xl px-4 py-3 text-[#1a1a18] outline-none focus:border-[#7a9e7e] text-sm transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6b6b63] mb-1.5">From</label>
          <input value={from} onChange={(e) => setFrom(e.target.value)} id="msg-from"
            className="w-full bg-white border border-[#e8e5de] rounded-xl px-4 py-3 text-[#1a1a18] outline-none focus:border-[#7a9e7e] text-sm transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#6b6b63] mb-1.5">Message</label>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} id="msg-text"
          className="w-full bg-white border border-[#e8e5de] rounded-xl px-4 py-3 text-[#1a1a18] outline-none focus:border-[#7a9e7e] text-sm transition-colors resize-none" />
      </div>

      {/* Live gift card preview */}
      <div className="relative bg-gradient-to-br from-[#f0f5f0] to-[#fdf9f0] rounded-2xl border border-[#e8e5de] p-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#7a9e7e]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-[#9b9b90] text-xs uppercase tracking-widest mb-3">Gift Card Preview</p>
        <p className="font-display text-lg font-semibold text-[#1a1a18]">Dear {to},</p>
        <p className="text-[#6b6b63] text-sm mt-1.5 leading-relaxed">{msg}</p>
        <p className="text-[#9b9b90] text-sm mt-3">— {from}</p>
      </div>
    </div>
  );
}

function PaymentStep() {
  return (
    <div className="space-y-4">
      <SectionTitle>Payment</SectionTitle>
      <div className="bg-white rounded-2xl border border-[#e8e5de] p-4 space-y-2.5"
        style={{ boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
        <p className="text-[#9b9b90] text-xs uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-[#6b6b63]">Your selected gift</span>
          <span className="font-medium text-[#1a1a18]">Rs. 4,500</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#9b9b90]">Standard Delivery</span>
          <span className="text-[#6b6b63]">Rs. 350</span>
        </div>
        <div className="border-t border-[#e8e5de] pt-2.5 mt-2.5 flex justify-between">
          <span className="font-semibold text-[#1a1a18]">Total</span>
          <span className="font-bold text-lg text-[#1a1a18]">Rs. 4,850</span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { id: "card", label: "Credit / Debit Card", icon: "💳" },
          { id: "koko", label: "Koko — Pay in 3", icon: "✨" },
          { id: "cod", label: "Cash on Delivery", icon: "💵" },
        ].map((m) => (
          <button key={m.id} id={`pay-${m.id}`}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-[#e8e5de] bg-white hover:border-[#a8c5ab] hover:bg-[#f5f9f5] text-left transition-colors"
            style={{ boxShadow: "0 1px 2px rgba(26,26,24,0.04)" }}>
            <span className="text-xl">{m.icon}</span>
            <span className="flex-1 font-medium text-sm text-[#1a1a18]">{m.label}</span>
            <ChevronRight className="w-4 h-4 text-[#9b9b90]" />
          </button>
        ))}
      </div>
    </div>
  );
}
