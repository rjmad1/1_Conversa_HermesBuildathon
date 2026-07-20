import { PublishedArtifact, PublicationManifest, SemanticPublication } from "../domain/models";

export const KNOWLEDGE_PUBLISHING_EVENTS = {
  PUBLICATION_REQUESTED: "knowledge_publishing.publication_requested",
  PUBLICATION_GENERATED: "knowledge_publishing.publication_generated",
  PUBLICATION_VALIDATED: "knowledge_publishing.publication_validated",
  PUBLICATION_FAILED: "knowledge_publishing.publication_failed",
  PUBLICATION_EXPORTED: "knowledge_publishing.publication_exported",
} as const;

export interface PublicationRequestedPayload {
  sourcePackageId: string;
  publisherId: string;
  profileId?: string;
  targetFormats?: string[];
  timestamp: number;
}

export interface PublicationGeneratedPayload {
  publicationId: string;
  sourcePackageId: string;
  publisherId: string;
  rendererId: string;
  semanticModel: SemanticPublication;
  artifact: PublishedArtifact<any>;
  manifest: PublicationManifest;
  timestamp: number;
}

export interface PublicationValidatedPayload {
  publicationId: string;
  manifest: PublicationManifest;
  isValid: boolean;
  timestamp: number;
}

export interface PublicationFailedPayload {
  sourcePackageId: string;
  publisherId: string;
  error: string;
  timestamp: number;
}

export interface PublicationExportedPayload {
  publicationId: string;
  adapterId: string;
  exportId: string;
  targetSystem: string;
  timestamp: number;
}
