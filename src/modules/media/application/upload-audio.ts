import { randomUUID } from "node:crypto";
import type { AppContext } from "../../app-context";
import { auditMeta } from "../../app-context";
import type { AudioAsset } from "../../../shared/validation/schemas";
import { AppError, ErrorCode } from "../../../shared/errors/AppError";
import { allowedMimeTypes, isVideoEnabled } from "../../../shared/config/env";
import { checksumOf, sanitizeFilename, isExtensionMimeConsistent } from "../../../shared/validation/media";
import { formatForMime } from "../../../shared/validation/formats";
import { logger } from "../../../shared/logging/logger";

export interface UploadAudioInput {
  file: { bytes: Uint8Array; fileName: string; mimeType: string; durationSeconds?: number };
}

export class UploadMeetingAudio {
  constructor(private readonly ctx: AppContext) {}

  async execute(meetingId: string, input: UploadAudioInput, correlationId: string): Promise<AudioAsset> {
    const cfg = this.ctx.config;
    const meeting = await this.ctx.repos.meeting.get(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId);
    if (!meeting) throw new AppError(ErrorCode.MEETING_NOT_FOUND, "Meeting not found", 404);

    const mime = input.file.mimeType;
    if (!isVideoEnabled(cfg) && (mime.startsWith("video/") || mime === "video/mp4")) {
      throw new AppError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Only audio files are supported (MP3, WAV, M4A).", 415);
    }
    const allowed = allowedMimeTypes(cfg);
    if (!allowed.includes(mime)) {
      throw new AppError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Unsupported audio MIME type", 415, { received: mime, allowed });
    }
    const fmt = formatForMime(mime);
    if (!fmt) throw new AppError(ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Unsupported audio format", 415);

    if (input.file.bytes.length === 0) throw new AppError(ErrorCode.VALIDATION_ERROR, "Empty file rejected", 400);
    if (input.file.bytes.length > cfg.AUDIO_MAX_BYTES)
      throw new AppError(ErrorCode.VALIDATION_ERROR, "File exceeds maximum size", 400, { received: input.file.bytes.length, allowed: cfg.AUDIO_MAX_BYTES });
    if (!isExtensionMimeConsistent(input.file.fileName, mime))
      throw new AppError(ErrorCode.VALIDATION_ERROR, "File extension and MIME type mismatch", 400, { received: input.file.fileName, allowed: mime });
    const duration = input.file.durationSeconds ?? 0;
    if (duration > cfg.AUDIO_MAX_SECONDS)
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Audio duration exceeds limit", 400, { received: duration, allowed: cfg.AUDIO_MAX_SECONDS });

    const checksum = checksumOf(input.file.bytes);
    const existing = await this.ctx.repos.audio.findByChecksum(this.ctx.identity.tenantId, this.ctx.identity.workspaceId, meetingId, checksum);
    if (existing) {
      await this.ctx.audit.record({
        ...auditMeta(this.ctx, meetingId, correlationId),
        entityType: "AUDIO_ASSET",
        entityId: existing.id,
        eventType: "AUDIO_DUPLICATE_SKIPPED",
        metadata: { checksum },
      });
      return existing;
    }

    const id = randomUUID();
    const ref = this.ctx.storage.buildRef(
      this.ctx.identity.tenantId,
      this.ctx.identity.workspaceId,
      meetingId,
      id,
    );
    await this.ctx.storage.put(ref, input.file.bytes, mime);

    const now = new Date().toISOString();
    const asset: AudioAsset = {
      id,
      tenantId: this.ctx.identity.tenantId,
      workspaceId: this.ctx.identity.workspaceId,
      meetingId,
      source: "UPLOAD",
      fileName: sanitizeFilename(input.file.fileName),
      mimeType: mime,
      format: fmt,
      sizeBytes: input.file.bytes.length,
      durationSeconds: duration,
      checksum,
      storageReference: ref,
      status: "STORED",
      createdAt: now,
      updatedAt: now,
    };
    await this.ctx.repos.audio.save(asset);
    await this.ctx.audit.record({
      ...auditMeta(this.ctx, meetingId, correlationId),
      entityType: "AUDIO_ASSET",
      entityId: id,
      eventType: "AUDIO_UPLOADED",
      metadata: { format: fmt, sizeBytes: asset.sizeBytes },
    });
    logger.info({ operation: "UploadMeetingAudio", correlationId, outcome: "success" }, "audio stored");
    return asset;
  }
}
