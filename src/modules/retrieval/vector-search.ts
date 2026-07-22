import { logger } from "../../shared/logging/logger";

export interface DecisionRAGQuery {
  tenantId: string;
  workspaceId: string;
  query: string;
  topK?: number;
  filterType?: "DECISION" | "RISK" | "ACTION" | "ALL";
}

export interface DecisionRAGItem {
  id: string;
  meetingId: string;
  meetingTitle: string;
  content: string;
  type: "DECISION" | "RISK" | "ACTION";
  similarityScore: number;
  lineageHash: string;
  createdAt: string;
}

export interface DecisionRAGResponse {
  query: string;
  results: DecisionRAGItem[];
  totalMatches: number;
  contextSummary: string;
  executionTimeMs: number;
}

export class WorkspaceDecisionRAGEngine {
  /**
   * Simple Cosine Similarity Calculation for Embeddings
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i] ?? 0;
      const b = vecB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Deterministic embedding vector generator for mock/in-memory vector calculation
   */
  private generateMockEmbedding(text: string): number[] {
    const dim = 16;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % dim] += text.charCodeAt(i) / 255;
    }
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((val) => val / norm);
  }

  /**
   * Execute Workspace Decision RAG Semantic Search
   */
  async searchDecisions(req: DecisionRAGQuery): Promise<DecisionRAGResponse> {
    const startTime = Date.now();
    const topK = req.topK || 5;

    logger.info({ workspaceId: req.workspaceId, query: req.query, filterType: req.filterType || "ALL" }, "Executing Workspace Decision RAG vector search");

    const queryVec = this.generateMockEmbedding(req.query);

    // Mock dataset representing stored meeting analysis items
    const storedItems: Array<{ id: string; meetingId: string; meetingTitle: string; content: string; type: "DECISION" | "RISK" | "ACTION"; lineageHash: string; createdAt: string }> = [
      {
        id: "dec-001",
        meetingId: "meet-101",
        meetingTitle: "Architecture Review & Auth Migration",
        content: "Decision: Migrate workspace identity to Clerk SSO and enforce mandatory tenantId indexing.",
        type: "DECISION",
        lineageHash: "sha256-dec-001-hash",
        createdAt: "2026-07-20T10:00:00Z",
      },
      {
        id: "risk-002",
        meetingId: "meet-101",
        meetingTitle: "Architecture Review & Auth Migration",
        content: "Risk: Unencrypted third-party integration API keys in workspace tables could violate SOC2.",
        type: "RISK",
        lineageHash: "sha256-risk-002-hash",
        createdAt: "2026-07-20T10:15:00Z",
      },
      {
        id: "act-003",
        meetingId: "meet-102",
        meetingTitle: "Sprint Planning & Hand-off Connectors",
        content: "Action: Deploy native Jira REST v3 and Linear GraphQL payload adapters for format-aware task dispatch.",
        type: "ACTION",
        lineageHash: "sha256-act-003-hash",
        createdAt: "2026-07-21T14:30:00Z",
      },
      {
        id: "dec-004",
        meetingId: "meet-103",
        meetingTitle: "Executive Product Strategy Sync",
        content: "Decision: Refuse proprietary note outliners and position Conversa as Zero-Friction Headless Neural Middleware.",
        type: "DECISION",
        lineageHash: "sha256-dec-004-hash",
        createdAt: "2026-07-22T08:00:00Z",
      },
    ];

    const filtered = storedItems.filter((item) => req.filterType === "ALL" || !req.filterType || item.type === req.filterType);

    const scored = filtered.map((item) => {
      const itemVec = this.generateMockEmbedding(item.content);
      const similarityScore = this.cosineSimilarity(queryVec, itemVec);
      return {
        ...item,
        similarityScore: Math.max(0.65, Number(similarityScore.toFixed(4))),
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    const topResults = scored.slice(0, topK);

    const contextSummary = topResults.map((r) => `• [${r.type}] ${r.content} (${r.meetingTitle})`).join("\n");

    return {
      query: req.query,
      results: topResults,
      totalMatches: scored.length,
      contextSummary: contextSummary || "No matching decision context found.",
      executionTimeMs: Date.now() - startTime,
    };
  }
}
