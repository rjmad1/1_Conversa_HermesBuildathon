import type { AppContext } from "../../modules/app-context";
import { logger } from "../../shared/logging/logger";

export interface RagResult {
  answer: string;
  sources: { meetingId: string; title: string; type: "SUMMARY" | "DECISION" | "ACTION" }[];
}

export class WorkspaceRagEngine {
  constructor(private readonly ctx: AppContext) {}

  async queryMemory(query: string): Promise<RagResult> {
    const { tenantId, workspaceId } = this.ctx.identity;
    logger.info({ query, tenantId, workspaceId }, "Querying workspace RAG memory");

    // 1. Gather all workspace context
    const meetings = await this.ctx.repos.meeting.listByScope(tenantId, workspaceId);
    const sources: RagResult["sources"] = [];
    const contextBlocks: string[] = [];

    const loweredQuery = query.toLowerCase();

    for (const meeting of meetings) {
      const analysis = await this.ctx.repos.meetingAnalysis.getByMeeting(tenantId, workspaceId, meeting.id);
      if (!analysis) continue;

      // Check summary
      if (analysis.summary.toLowerCase().includes(loweredQuery) || loweredQuery.split(" ").some(w => w.length > 3 && analysis.summary.toLowerCase().includes(w))) {
        sources.push({ meetingId: meeting.id, title: meeting.title, type: "SUMMARY" });
        contextBlocks.push(`[Meeting: ${meeting.title} - Summary] ${analysis.summary}`);
      }

      // Check decisions
      for (const d of analysis.decisions) {
        const text = `${d.description} ${d.rationale}`;
        if (text.toLowerCase().includes(loweredQuery) || loweredQuery.split(" ").some(w => w.length > 3 && text.toLowerCase().includes(w))) {
          sources.push({ meetingId: meeting.id, title: meeting.title, type: "DECISION" });
          contextBlocks.push(`[Meeting: ${meeting.title} - Decision] ${d.description} (Rationale: ${d.rationale})`);
        }
      }

      // Check proposed actions
      for (const a of analysis.proposedActions) {
        const text = `${a.description} (Owner: ${a.ownerName})`;
        if (text.toLowerCase().includes(loweredQuery) || loweredQuery.split(" ").some(w => w.length > 3 && text.toLowerCase().includes(w))) {
          sources.push({ meetingId: meeting.id, title: meeting.title, type: "ACTION" });
          contextBlocks.push(`[Meeting: ${meeting.title} - Action Item] ${a.description} (Owner: ${a.ownerName || "Unassigned"}, Status: ${a.status})`);
        }
      }
    }

    // 2. Synthesize answer using the analysis LLM provider
    if (contextBlocks.length === 0) {
      return {
        answer: "I couldn't find any relevant discussions or decisions in the past workspace meetings.",
        sources: [],
      };
    }

    const contextText = contextBlocks.join("\n\n");
    
    // We can simulate or use the analysis provider to draft a summary response
    // To keep it simple, fast, and robust under all conditions, we formulate a clean synthesized response
    // containing the matching facts, or we can query our LLM provider.
    // Let's query the LLM provider for a real RAG experience!
    try {
      const prompt = `Synthesize a concise answer to the user query based ONLY on the following workspace meeting history. User Query: "${query}"\n\nMeeting History:\n${contextText}`;
      const response = await this.ctx.analysis.analyze({
        meetingId: "00000000-0000-0000-0000-000000000000",
        transcriptContent: prompt,
        language: "en",
        correlationId: "rag-synthesis",
      });

      return {
        answer: response.summary,
        sources: sources.slice(0, 5), // return top 5 unique sources
      };
    } catch (err) {
      // Fallback synthesis if LLM fails or is in mock mode
      const summaryText = `Based on past meetings, we found relevant details:\n` + contextBlocks.map(b => `- ${b}`).join("\n");
      return {
        answer: summaryText,
        sources: sources.slice(0, 5),
      };
    }
  }
}
