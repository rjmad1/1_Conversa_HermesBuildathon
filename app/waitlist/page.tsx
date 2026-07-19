"use client";

import { useState } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Sparkles, ArrowRight, CheckCircle2, Users, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [spotNumber, setSpotNumber] = useState(142);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.spotNumber) setSpotNumber(data.spotNumber);
      }
      setIsSubmitted(true);
      toast.success("You've been added to the Conversa Priority Waitlist!");
    } catch (err) {
      setIsSubmitted(true);
      toast.success("Joined waitlist!");
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`https://conversa.ai/waitlist?ref=${spotNumber}`);
    toast.success("Referral link copied to clipboard");
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Conversa Enterprise Early Access
          </div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight">
            Audio-to-Governed-Action Engine
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-lg mx-auto">
            Transform meetings into verified, human-governed actions with real-time auditability.
          </p>
        </div>

        {!isSubmitted ? (
          <AnimatedCard variant="clay" index={0} className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm",
                    "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-brand-500"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm",
                      "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-brand-500"
                    )}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm",
                      "bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-brand-500"
                    )}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Requesting Access..." : "Request Priority Access"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </AnimatedCard>
        ) : (
          <AnimatedCard variant="clay" index={0} className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold font-heading">You're on the priority list!</h2>
            <p className="text-sm text-[var(--muted)]">
              Your position in queue is <span className="font-bold text-brand-600 font-mono">#{spotNumber}</span>. We'll send your invite as soon as a spot opens.
            </p>

            <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between text-xs font-mono">
              <span className="truncate">https://conversa.ai/waitlist?ref={spotNumber}</span>
              <button
                onClick={copyReferral}
                className="inline-flex items-center gap-1 text-brand-500 hover:underline shrink-0 ml-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </AnimatedCard>
        )}
      </div>
    </PageTransition>
  );
}
