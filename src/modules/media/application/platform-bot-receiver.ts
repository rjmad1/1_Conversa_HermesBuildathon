import { createHmac } from "node:crypto";
import { logger } from "../../../shared/logging/logger";

export interface ZoomWebhookPayload {
  event: string;
  payload: {
    plainToken?: string;
    object?: {
      id?: string;
      topic?: string;
      duration?: number;
      start_time?: string;
      recording_files?: Array<{
        id: string;
        file_type: string;
        download_url: string;
        file_extension?: string;
      }>;
    };
  };
}

export interface TeamsWebhookPayload {
  subscriptionId?: string;
  changeType?: string;
  resource?: string;
  resourceData?: {
    id?: string;
    subject?: string;
    recordingUrl?: string;
    durationSeconds?: number;
  };
}

export class PlatformBotReceiver {
  constructor(private readonly secretToken: string = "conversa-webhook-secret") {}

  /**
   * Handle Zoom URL validation CRC challenge
   */
  handleZoomCrcValidation(plainToken: string): { plainToken: string; encryptedToken: string } {
    const encryptedToken = createHmac("sha256", this.secretToken)
      .update(plainToken)
      .digest("hex");
    return { plainToken, encryptedToken };
  }

  /**
   * Process incoming Zoom meeting events
   */
  processZoomEvent(body: ZoomWebhookPayload): {
    handled: boolean;
    meetingId?: string;
    topic?: string;
    recordingUrl?: string;
    eventType: string;
  } {
    logger.info({ event: body.event }, "Processing Zoom platform webhook event");

    if (body.event === "endpoint.url_validation" && body.payload.plainToken) {
      return { handled: true, eventType: "url_validation" };
    }

    const obj = body.payload.object;
    if (body.event === "recording.completed" && obj) {
      const audioFile = obj.recording_files?.find(
        (f) => f.file_type === "AUDIO_ONLY" || f.file_type === "M4A" || f.file_extension === "MP3"
      ) || obj.recording_files?.[0];

      return {
        handled: true,
        meetingId: obj.id || `zoom-${Date.now()}`,
        topic: obj.topic || "Zoom Meeting",
        recordingUrl: audioFile?.download_url || "",
        eventType: "recording.completed",
      };
    }

    return {
      handled: true,
      meetingId: obj?.id,
      topic: obj?.topic,
      eventType: body.event,
    };
  }

  /**
   * Process incoming Microsoft Teams call & recording events
   */
  processTeamsEvent(body: TeamsWebhookPayload): {
    handled: boolean;
    meetingId?: string;
    topic?: string;
    recordingUrl?: string;
  } {
    logger.info({ resource: body.resource }, "Processing Microsoft Teams platform webhook event");

    const data = body.resourceData;
    return {
      handled: true,
      meetingId: data?.id || `teams-${Date.now()}`,
      topic: data?.subject || "Microsoft Teams Call",
      recordingUrl: data?.recordingUrl || "",
    };
  }
}
