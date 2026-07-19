"use client";

import { use } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { ProcessingStepper } from "@/components/meetings/processing-stepper";

export default function MeetingProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);

  return (
    <PageTransition>
      <div className="py-8">
        <ProcessingStepper meetingId={meetingId} />
      </div>
    </PageTransition>
  );
}
