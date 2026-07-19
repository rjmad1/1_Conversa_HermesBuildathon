import { PageTransition } from "@/components/motion/page-transition";
import { CrewConfigPanel } from "@/components/agents/crew-config-panel";

export const metadata = { title: "Agency Control | Conversa" };

export default function AgencyControlPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Agency Control Panel</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage multi-agent crew personas, confidence guardrails, and LLM providers.
          </p>
        </div>

        <CrewConfigPanel />
      </div>
    </PageTransition>
  );
}
