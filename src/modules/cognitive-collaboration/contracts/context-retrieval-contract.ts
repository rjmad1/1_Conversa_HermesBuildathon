export type ContextQueryType =
  | "TranscriptRange"
  | "Speaker"
  | "Topic"
  | "SemanticSimilarity"
  | "Timestamp"
  | "Entity"
  | "DiscussionThread"
  | "Meeting"
  | "Workspace";

export interface ContextFilter {
  workspaceId?: string;
  meetingId?: string;
  speakerId?: string;
  topic?: string;
  entityId?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  tags?: string[];
}

export interface ContextQuery {
  queryType: ContextQueryType;
  text?: string;
  filter?: ContextFilter;
  limit?: number;
  minSimilarity?: number;
}

export interface ContextReference {
  id: string;
  sourceId: string; // e.g. meetingId, docId
  sourceType: "Meeting" | "Email" | "Slack" | "Document" | "CustomerCall";
  locationSnippet?: string;
  startMs?: number;
  endMs?: number;
  speakerId?: string;
  speakerName?: string;
}

export interface ContextChunk {
  chunkId: string;
  content: string;
  score: number; // Relevance or similarity score (0..1)
  reference: ContextReference;
  metadata?: Record<string, unknown>;
}

export interface ContextCapability {
  capabilityName: string;
  supportedQueryTypes: ContextQueryType[];
  supportsSemanticSearch: boolean;
  supportsStreaming: boolean;
}

/**
 * Provider-Neutral Contract for Context Retrieval.
 * Downstream fulfillment is delegated to AegisOS or external Context Services.
 */
export interface IContextRetrievalProvider {
  id: string;
  name: string;
  getCapabilities(): ContextCapability;
  retrieveContext(query: ContextQuery): Promise<ContextChunk[]>;
}
