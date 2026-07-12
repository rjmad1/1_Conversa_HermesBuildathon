export interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  runId: string;
  taskId: string;
  relevantContext: string;
  priorFindings: any;
  policyConstraints: string[];
  unresolvedQuestions: string[];
}
