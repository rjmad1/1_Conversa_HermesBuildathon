import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import { PlanMeetingAnalysis } from "./plan-meeting-analysis";
import { ExecuteAgentTask } from "./execute-agent-task";
import { ReviewAgentOutput } from "./review-agent-output";
import type { AgencyRun, AgencyStep } from "../domain/agent-run";
import type { AgentHandoff } from "../domain/handoff";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { estimateCost } from "../../../shared/observability/model-pricing";
import { logger } from "../../../shared/logging/logger";

export class RunMeetingAgency {
  private planner: PlanMeetingAnalysis;
  private executor: ExecuteAgentTask;
  private reviewer: ReviewAgentOutput;

  constructor(private readonly ctx: AppContext) {
    this.planner = new PlanMeetingAnalysis(ctx);
    this.executor = new ExecuteAgentTask(ctx);
    this.reviewer = new ReviewAgentOutput(ctx);
  }

  async execute(
    meetingId: string,
    correlationId: string,
    options?: {
      enabledRoles?: Record<string, boolean>;
      confidenceThreshold?: number;
      approvalRequirement?: boolean;
    }
  ): Promise<AgencyRun> {
    const tenantId = this.ctx.identity.tenantId;
    const workspaceId = this.ctx.identity.workspaceId;

    // Validate meeting exists and belongs to workspace
    const meeting = await this.ctx.repos.meeting.get(tenantId, workspaceId, meetingId);
    if (!meeting) {
      throw new AppError(ErrorCode.NOT_FOUND, "Meeting not found in this scope", 404);
    }

    const transcripts = await this.ctx.repos.transcript.findByMeeting(tenantId, workspaceId, meetingId);
    const transcript = transcripts.find((t) => t.status === "READY");
    if (!transcript) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "No valid transcript to analyze", 400);
    }

    const runId = randomUUID();
    const startTime = new Date().toISOString();

    // 1. Planning Step
    const planResult = await this.planner.execute(transcript.content);
    const plan = planResult.plan;

    // Override plan steps if options are specified
    if (options?.enabledRoles) {
      plan.steps = plan.steps.map((step) => {
        const isEnabled = options.enabledRoles?.[step.agentRole];
        if (isEnabled !== undefined) {
          return { ...step, skipped: !isEnabled };
        }
        return step;
      });
    }

    // Save initial trace
    const run: AgencyRun = {
      runId,
      tenantId,
      workspaceId,
      meetingId,
      startedAt: startTime,
      completedAt: null,
      status: "RUNNING",
      plan,
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCost: 0,
      finalOutcome: null,
    };
    await (this.ctx.repos as any).agencyRun.save(run);

    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meetingId, correlationId),
      entityType: "AGENCY_RUN",
      entityId: runId,
      eventType: "PLAN_CREATED",
      metadata: { plan },
    });

    const startMs = Date.now();
    let totalInputTokens = planResult.tokens.input;
    let totalOutputTokens = planResult.tokens.output;
    let accumulatedFindings: any = { decisions: [], risks: [], proposedActions: [] };

    try {
      let parentStepId: string | null = null;

      for (const stepConfig of plan.steps) {
        if (stepConfig.skipped) {
          continue;
        }

        if (stepConfig.agentRole === "QA_REVIEWER") {
          continue; // Run QA as part of each specialist step or at the end
        }

        const stepId = randomUUID();
        const stepStartedAt = new Date().toISOString();

        // Save step start
        const stepTrace: AgencyStep = {
          stepId,
          runId,
          tenantId,
          workspaceId,
          parentStepId,
          agentRole: stepConfig.agentRole,
          taskType: stepConfig.taskType,
          startedAt: stepStartedAt,
          completedAt: null,
          status: "RUNNING",
          sanitizedInputSummary: `Analyze transcript of length ${transcript.content.length} chars`,
          sanitizedOutputSummary: "",
          inputTokens: 0,
          outputTokens: 0,
          estimatedCost: 0,
          revisionCount: 0,
          errorCode: null,
          escalationReason: null,
        };
        await (this.ctx.repos as any).agencyRun.saveStep(stepTrace);

        await this.ctx.audit.record({
          ...auditMeta(this.ctx, meetingId, correlationId),
          entityType: "AGENCY_STEP",
          entityId: stepId,
          eventType: "SPECIALIST_STARTED",
          metadata: { agentRole: stepConfig.agentRole },
        });

        // Handoff Memory Envelope
        const handoff: AgentHandoff = {
          fromAgent: "MANAGER",
          toAgent: stepConfig.agentRole,
          runId,
          taskId: stepId,
          relevantContext: transcript.content,
          priorFindings: accumulatedFindings,
          policyConstraints: [],
          unresolvedQuestions: [],
        };

        // Execution and QA Loop
        let revisionCount = 0;
        let stepStatus: AgencyStep["status"] = "COMPLETED";
        let stepErrorCode: string | null = null;
        let stepEscalationReason: string | null = null;
        let findings: any = null;

        while (revisionCount <= 1) {
          const execRes = await this.executor.execute(stepConfig.agentRole as any, handoff);
          findings = execRes.findings;
          totalInputTokens += execRes.tokens.input;
          totalOutputTokens += execRes.tokens.output;

          stepTrace.inputTokens += execRes.tokens.input;
          stepTrace.outputTokens += execRes.tokens.output;

          // Run QA Reviewer
          const reviewRes = await this.reviewer.execute(findings, handoff);
          totalInputTokens += reviewRes.tokens.input;
          totalOutputTokens += reviewRes.tokens.output;

          stepTrace.inputTokens += reviewRes.tokens.input;
          stepTrace.outputTokens += reviewRes.tokens.output;

          if (reviewRes.result.approved) {
            break;
          } else if (reviewRes.result.escalated) {
            stepStatus = "ESCALATED";
            stepEscalationReason = reviewRes.result.reason;
            break;
          } else {
            // Needs revision
            revisionCount++;
            if (revisionCount > 1) {
              stepStatus = "ESCALATED";
              stepEscalationReason = `Automatic revision limit exceeded. Blocker: ${reviewRes.result.reason}`;
              break;
            }

            handoff.policyConstraints.push(reviewRes.result.reason || "Constraint violated");
            handoff.priorFindings = findings;

            await this.ctx.audit.record({
              ...auditMeta(this.ctx, meetingId, correlationId),
              entityType: "AGENCY_STEP",
              entityId: stepId,
              eventType: "REVISION_REQUESTED",
              metadata: { agentRole: stepConfig.agentRole, reason: reviewRes.result.reason },
            });
          }
        }

        stepTrace.completedAt = new Date().toISOString();
        stepTrace.status = stepStatus;
        stepTrace.revisionCount = revisionCount;
        stepTrace.errorCode = stepErrorCode;
        stepTrace.escalationReason = stepEscalationReason;
        stepTrace.estimatedCost = estimateCost(this.ctx.analysis.name, this.ctx.config.ANALYSIS_MODEL || "fake", stepTrace.inputTokens, stepTrace.outputTokens);
        stepTrace.sanitizedOutputSummary = JSON.stringify(findings);

        await (this.ctx.repos as any).agencyRun.saveStep(stepTrace);

        await this.ctx.audit.record({
          ...auditMeta(this.ctx, meetingId, correlationId),
          entityType: "AGENCY_STEP",
          entityId: stepId,
          eventType: stepStatus === "ESCALATED" ? "ESCALATION_RAISED" : "SPECIALIST_COMPLETED",
          metadata: { agentRole: stepConfig.agentRole, outcome: stepStatus, escalationReason: stepEscalationReason },
        });

        if (stepStatus === "ESCALATED") {
          run.status = "ESCALATED";
          run.completedAt = new Date().toISOString();
          run.totalLatencyMs = Date.now() - startMs;
          run.totalInputTokens = totalInputTokens;
          run.totalOutputTokens = totalOutputTokens;
          run.estimatedCost = estimateCost(this.ctx.analysis.name, this.ctx.config.ANALYSIS_MODEL || "fake", totalInputTokens, totalOutputTokens);
          await (this.ctx.repos as any).agencyRun.save(run);
          return run;
        }

        // Accumulate findings
        if (findings.decisions) accumulatedFindings.decisions.push(...findings.decisions);
        if (findings.risks) accumulatedFindings.risks.push(...findings.risks);
        if (findings.proposedActions) accumulatedFindings.proposedActions.push(...findings.proposedActions);

        parentStepId = stepId;
      }

      // Finish successfully or pause before final approval
      const isApprovalRequired = options?.approvalRequirement ?? true;

      // Save the analysis outputs in the repository
      const now = new Date().toISOString();
      const decisions = accumulatedFindings.decisions.map((d: any) => ({
        ...d,
        id: d.id || randomUUID(),
        meetingId,
        createdAt: now,
      }));
      const proposedActions = accumulatedFindings.proposedActions.map((a: any) => ({
        ...a,
        id: a.id || randomUUID(),
        meetingId,
        status: a.status || "PROPOSED",
        ownerReference: a.ownerReference || null,
        createdAt: now,
        updatedAt: now,
      }));

      const finalAnalysis = {
        id: randomUUID(),
        meetingId,
        summary: `Extracted ${decisions.length} decisions, ${proposedActions.length} actions, and ${accumulatedFindings.risks.length} risks.`,
        topics: ["agency-run"],
        decisions,
        proposedActions,
        risks: accumulatedFindings.risks,
        createdAt: now,
      };

      await this.ctx.repos.meetingAnalysis.save(tenantId, workspaceId, finalAnalysis);
      for (const d of decisions) {
        await this.ctx.repos.meetingAnalysis.saveDecision(tenantId, workspaceId, d);
      }
      for (const a of proposedActions) {
        await this.ctx.repos.meetingAnalysis.saveAction(tenantId, workspaceId, a);
      }

      run.status = isApprovalRequired ? "PAUSED" : "COMPLETED";
      run.completedAt = new Date().toISOString();
      run.totalLatencyMs = Date.now() - startMs;
      run.totalInputTokens = totalInputTokens;
      run.totalOutputTokens = totalOutputTokens;
      run.estimatedCost = estimateCost(this.ctx.analysis.name, this.ctx.config.ANALYSIS_MODEL || "fake", totalInputTokens, totalOutputTokens);
      await (this.ctx.repos as any).agencyRun.save(run);

      logger.info({ operation: "RunMeetingAgency", runId, outcome: "success", durationMs: run.totalLatencyMs }, "agency run completed successfully");

      return run;
    } catch (err) {
      run.status = "FAILED";
      run.completedAt = new Date().toISOString();
      run.totalLatencyMs = Date.now() - startMs;
      run.totalInputTokens = totalInputTokens;
      run.totalOutputTokens = totalOutputTokens;
      run.estimatedCost = estimateCost(this.ctx.analysis.name, this.ctx.config.ANALYSIS_MODEL || "fake", totalInputTokens, totalOutputTokens);
      await (this.ctx.repos as any).agencyRun.save(run);

      logger.error({ operation: "RunMeetingAgency", runId, outcome: "failure" }, "agency run failed: " + (err as Error).message);
      throw err;
    }
  }
}
