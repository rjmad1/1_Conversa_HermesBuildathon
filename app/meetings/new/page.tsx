import { PageTransition } from "@/components/motion/page-transition";
import { MeetingSetupForm } from "@/components/meetings/meeting-setup-form";

export const metadata = { title: "New Meeting | Conversa" };

export default function NewMeetingPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Schedule / Create Meeting</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Configure meeting metadata before capturing audio or transcript.
          </p>
        </div>

        <MeetingSetupForm />
      </div>
    </PageTransition>
  );
}
