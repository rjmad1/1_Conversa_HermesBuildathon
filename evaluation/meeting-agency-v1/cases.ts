export interface ExpectedDecision {
  description: string;
  rationale: string;
  sourceEvidence: string;
  confidence: number;
}

export interface ExpectedAction {
  description: string;
  ownerName: string | null;
  dueDate: string | null; // ISO string
  priority: "HIGH" | "MEDIUM" | "LOW";
  targetSystem: string;
  actionType: string;
  rationale: string;
  sourceEvidence: string;
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface EvalCase {
  id: string;
  name: string;
  transcript: string;
  expectedDecisions: ExpectedDecision[];
  expectedRisks: string[];
  expectedActions: ExpectedAction[];
  expectedSkippedSpecialists: string[];
  requiresRevision?: boolean;
  revisionReason?: string;
  requiresEscalation?: boolean;
  escalationReason?: string;
  wrongTenantAccess?: boolean;
  wrongWorkspaceAccess?: boolean;
  malformedInput?: boolean;
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: "case-01-basic",
    name: "Clear decisions, risks, actions",
    transcript: "We decided to launch the beta on the 15th. There is a risk that the server might overload. Priya owns the launch and will complete the checklist by 2026-07-15.",
    expectedDecisions: [
      {
        description: "Launch the beta on the 15th.",
        rationale: "Team decided to go ahead with the beta launch.",
        sourceEvidence: "We decided to launch the beta on the 15th.",
        confidence: 0.95,
      }
    ],
    expectedRisks: ["Risk of server overload during beta launch."],
    expectedActions: [
      {
        description: "Complete the beta launch checklist.",
        ownerName: "Priya",
        dueDate: "2026-07-15T00:00:00.000Z",
        priority: "HIGH",
        targetSystem: "INTERNAL",
        actionType: "TASK",
        rationale: "Ensure checklist is complete before launch.",
        sourceEvidence: "Priya owns the launch and will complete the checklist by 2026-07-15.",
        confidence: 0.9,
        riskLevel: "MEDIUM",
      }
    ],
    expectedSkippedSpecialists: [],
  },
  {
    id: "case-02-ambiguous-owner",
    name: "Ambiguous owner",
    transcript: "We should upgrade the database pool. Someone needs to run the migration script by tomorrow.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Run the database migration script.",
        ownerName: null,
        dueDate: "2026-07-13T00:00:00.000Z",
        priority: "MEDIUM",
        targetSystem: "DATABASE",
        actionType: "MIGRATION",
        rationale: "Upgrade database pool size.",
        sourceEvidence: "Someone needs to run the migration script by tomorrow.",
        confidence: 0.85,
        riskLevel: "MEDIUM",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-03-missing-due-date",
    name: "Missing due date",
    transcript: "We decided to implement the API cache. Maya will configure Redis when she has time.",
    expectedDecisions: [
      {
        description: "Implement the API cache.",
        rationale: "Improve endpoint response times.",
        sourceEvidence: "We decided to implement the API cache.",
        confidence: 0.9,
      }
    ],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Configure Redis cache.",
        ownerName: "Maya",
        dueDate: null,
        priority: "LOW",
        targetSystem: "REDIS",
        actionType: "CONFIGURATION",
        rationale: "Set up Redis to act as the API cache.",
        sourceEvidence: "Maya will configure Redis when she has time.",
        confidence: 0.88,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-04-conflicting-dates",
    name: "Conflicting dates",
    transcript: "Priya will deploy the update by Friday. Actually, let's make it Tuesday so we have time to test.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Deploy the update.",
        ownerName: "Priya",
        dueDate: "2026-07-14T00:00:00.000Z", // Tuesday
        priority: "HIGH",
        targetSystem: "PRODUCTION",
        actionType: "DEPLOYMENT",
        rationale: "Pushed to Tuesday to allow testing.",
        sourceEvidence: "Actually, let's make it Tuesday so we have time to test.",
        confidence: 0.9,
        riskLevel: "HIGH",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-05-no-decisions",
    name: "No decisions",
    transcript: "We discussed the weather and office design. We need to assign tasks later but nothing is resolved today.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-06-no-risks",
    name: "No risks",
    transcript: "We decided to host a team lunch. Priya will book the restaurant by Friday.",
    expectedDecisions: [
      {
        description: "Host a team lunch.",
        rationale: "Boost team morale.",
        sourceEvidence: "We decided to host a team lunch.",
        confidence: 0.95,
      }
    ],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Book the restaurant for team lunch.",
        ownerName: "Priya",
        dueDate: "2026-07-17T00:00:00.000Z",
        priority: "LOW",
        targetSystem: "INTERNAL",
        actionType: "BOOKING",
        rationale: "Select restaurant and reserve tables.",
        sourceEvidence: "Priya will book the restaurant by Friday.",
        confidence: 0.9,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-07-no-actions",
    name: "No actions",
    transcript: "We decided to freeze new feature development. The risk is that competitors might catch up.",
    expectedDecisions: [
      {
        description: "Freeze new feature development.",
        rationale: "Stabilize current production build.",
        sourceEvidence: "We decided to freeze new feature development.",
        confidence: 0.9,
      }
    ],
    expectedRisks: ["Competitors might catch up during the feature freeze."],
    expectedActions: [],
    expectedSkippedSpecialists: ["ACTION_SPECIALIST"],
  },
  {
    id: "case-08-multiple-owners",
    name: "Multiple owners",
    transcript: "Maya and Priya will run the security scanning tool by Friday.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Run the security scanning tool.",
        ownerName: "Maya, Priya",
        dueDate: "2026-07-17T00:00:00.000Z",
        priority: "MEDIUM",
        targetSystem: "SECURITY",
        actionType: "SCAN",
        rationale: "Identify vulnerabilities.",
        sourceEvidence: "Maya and Priya will run the security scanning tool by Friday.",
        confidence: 0.95,
        riskLevel: "MEDIUM",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-09-approval-required",
    name: "Approval-required proposal",
    transcript: "We propose to delete the legacy billing database tables. There is a high risk of losing old invoices. Rajeev will drop the tables by Tuesday.",
    expectedDecisions: [],
    expectedRisks: ["High risk of losing old invoices by deleting legacy database tables."],
    expectedActions: [
      {
        description: "Delete legacy billing database tables.",
        ownerName: "Rajeev",
        dueDate: "2026-07-14T00:00:00.000Z",
        priority: "HIGH",
        targetSystem: "DATABASE",
        actionType: "DELETION",
        rationale: "Clean up legacy database structures.",
        sourceEvidence: "Rajeev will drop the tables by Tuesday.",
        confidence: 0.9,
        riskLevel: "HIGH",
      }
    ],
    expectedSkippedSpecialists: [],
  },
  {
    id: "case-10-hallucination-trap",
    name: "Hallucination trap",
    transcript: "We discussed building a mobile app, but we explicitly rejected that idea because of budget limits.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-11-wrong-tenant",
    name: "Wrong-tenant access",
    transcript: "Sensitive tenant meeting details.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
    wrongTenantAccess: true,
  },
  {
    id: "case-12-wrong-workspace",
    name: "Wrong-workspace access",
    transcript: "Sensitive workspace meeting details.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
    wrongWorkspaceAccess: true,
  },
  {
    id: "case-13-malformed-input",
    name: "Malformed input",
    transcript: "",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
    malformedInput: true,
  },
  {
    id: "case-14-long-transcript",
    name: "Long transcript",
    transcript: "Welcome to the meeting.\n".repeat(150) + "We decided to purchase new monitors. Priya will order them by tomorrow.",
    expectedDecisions: [
      {
        description: "Purchase new monitors.",
        rationale: "Equip the team with better hardware.",
        sourceEvidence: "We decided to purchase new monitors.",
        confidence: 0.95,
      }
    ],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Order new monitors.",
        ownerName: "Priya",
        dueDate: "2026-07-13T00:00:00.000Z",
        priority: "LOW",
        targetSystem: "PROCUREMENT",
        actionType: "ORDER",
        rationale: "Procure hardware monitors.",
        sourceEvidence: "Priya will order them by tomorrow.",
        confidence: 0.9,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-15-repeated-statements",
    name: "Repeated statements",
    transcript: "We decided to move to AWS. Yes, we decided to move to AWS. Absolutely, moving to AWS is decided.",
    expectedDecisions: [
      {
        description: "Move to AWS.",
        rationale: "Migrate infrastructure to AWS.",
        sourceEvidence: "We decided to move to AWS.",
        confidence: 0.95,
      }
    ],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-16-contradictory-statements",
    name: "Contradictory statements",
    transcript: "We will adopt TypeScript. No, actually we decided to stay with JavaScript for compatibility.",
    expectedDecisions: [
      {
        description: "Stay with JavaScript.",
        rationale: "Maintain compatibility.",
        sourceEvidence: "decided to stay with JavaScript for compatibility.",
        confidence: 0.9,
      }
    ],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-17-needs-revision",
    name: "Policy violation requires revision",
    transcript: "Priya needs to deploy the hotfix immediately. No due date was given.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Deploy hotfix.",
        ownerName: "Priya",
        dueDate: "2026-07-13T00:00:00.000Z", // Corrected in revision from null
        priority: "HIGH",
        targetSystem: "PRODUCTION",
        actionType: "DEPLOYMENT",
        rationale: "Hotfix deployment required immediately.",
        sourceEvidence: "Priya needs to deploy the hotfix immediately.",
        confidence: 0.9,
        riskLevel: "HIGH",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
    requiresRevision: true,
    revisionReason: "Hotfix action requires a valid future due date under policy P2.",
  },
  {
    id: "case-18-requires-escalation",
    name: "Unresolved ambiguity requires escalation",
    transcript: "Someone needs to fix the broken build. But we don't know who owns the codebase, and no one is available.",
    expectedDecisions: [],
    expectedRisks: ["Build is broken and no owner is available to fix it."],
    expectedActions: [
      {
        description: "Fix the broken build.",
        ownerName: null,
        dueDate: null,
        priority: "HIGH",
        targetSystem: "CI",
        actionType: "FIX",
        rationale: "Build is blocked.",
        sourceEvidence: "Someone needs to fix the broken build.",
        confidence: 0.8,
        riskLevel: "HIGH",
      }
    ],
    expectedSkippedSpecialists: [],
    requiresEscalation: true,
    escalationReason: "Unresolved build owner and unavailability blocks action planning.",
  },
  {
    id: "case-19-only-decisions",
    name: "Only decisions",
    transcript: "We decided to rename the project to Hermit.",
    expectedDecisions: [
      {
        description: "Rename the project to Hermit.",
        rationale: "Rebrand project.",
        sourceEvidence: "We decided to rename the project to Hermit.",
        confidence: 0.95,
      }
    ],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-20-only-risks",
    name: "Only risks",
    transcript: "There is a risk that the API limit will be exceeded if we call it too frequently.",
    expectedDecisions: [],
    expectedRisks: ["API limit might be exceeded due to frequent calls."],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-21-only-actions",
    name: "Only actions",
    transcript: "Daniel will write the release notes by Friday.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Write the release notes.",
        ownerName: "Daniel",
        dueDate: "2026-07-17T00:00:00.000Z",
        priority: "MEDIUM",
        targetSystem: "DOCUMENTATION",
        actionType: "WRITE",
        rationale: "Prepare release notes for the upcoming deploy.",
        sourceEvidence: "Daniel will write the release notes by Friday.",
        confidence: 0.9,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-22-complex-sprint",
    name: "Complex sprint planning",
    transcript: "We decided to build the auth prototype next. Priya will implement the OAuth flow by 2026-07-14. Maya will scan for security vulnerabilities. There is a risk that the flow violates GDPR regulations.",
    expectedDecisions: [
      {
        description: "Build the auth prototype next.",
        rationale: "Begin user authentication phase.",
        sourceEvidence: "We decided to build the auth prototype next.",
        confidence: 0.95,
      }
    ],
    expectedRisks: ["OAuth flow might violate GDPR compliance requirements."],
    expectedActions: [
      {
        description: "Implement OAuth flow.",
        ownerName: "Priya",
        dueDate: "2026-07-14T00:00:00.000Z",
        priority: "HIGH",
        targetSystem: "AUTH",
        actionType: "DEVELOPMENT",
        rationale: "Integrate third-party OAuth provider.",
        sourceEvidence: "Priya will implement the OAuth flow by 2026-07-14.",
        confidence: 0.9,
        riskLevel: "HIGH",
      },
      {
        description: "Scan for security vulnerabilities.",
        ownerName: "Maya",
        dueDate: null,
        priority: "MEDIUM",
        targetSystem: "SECURITY",
        actionType: "SCAN",
        rationale: "Check code for flaws.",
        sourceEvidence: "Maya will scan for security vulnerabilities.",
        confidence: 0.85,
        riskLevel: "MEDIUM",
      }
    ],
    expectedSkippedSpecialists: [],
  },
  {
    id: "case-23-vacuous",
    name: "Vacuous transcript",
    transcript: "Hello, testing 1 2 3.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [],
    expectedSkippedSpecialists: ["DECISION_SPECIALIST", "RISK_SPECIALIST", "ACTION_SPECIALIST"],
  },
  {
    id: "case-24-date-range",
    name: "Date range in transcript",
    transcript: "Priya will conduct user tests between July 13th and July 15th.",
    expectedDecisions: [],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Conduct user tests.",
        ownerName: "Priya",
        dueDate: "2026-07-15T00:00:00.000Z", // end of range
        priority: "MEDIUM",
        targetSystem: "UX",
        actionType: "TESTING",
        rationale: "Assess user flow usability.",
        sourceEvidence: "Priya will conduct user tests between July 13th and July 15th.",
        confidence: 0.9,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  },
  {
    id: "case-25-policy-fine",
    name: "Policy fine action",
    transcript: "We decided to increase the session timeout. Daniel will update the configuration file by tomorrow.",
    expectedDecisions: [
      {
        description: "Increase the session timeout.",
        rationale: "Improve user session persistence.",
        sourceEvidence: "We decided to increase the session timeout.",
        confidence: 0.92,
      }
    ],
    expectedRisks: [],
    expectedActions: [
      {
        description: "Update the configuration file.",
        ownerName: "Daniel",
        dueDate: "2026-07-13T00:00:00.000Z",
        priority: "LOW",
        targetSystem: "CONFIGURATION",
        actionType: "UPDATE",
        rationale: "Set new session expiration duration.",
        sourceEvidence: "Daniel will update the configuration file by tomorrow.",
        confidence: 0.9,
        riskLevel: "LOW",
      }
    ],
    expectedSkippedSpecialists: ["RISK_SPECIALIST"],
  }
];
