import { z } from "zod";

export const AudioFormatSchema = z.enum(["MP3", "WAV", "M4A"]);
export type AudioFormat = z.infer<typeof AudioFormatSchema>;

export const MimeToFormat: Record<string, AudioFormat> = {
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/mp4": "M4A",
};

export function formatForMime(mime: string): AudioFormat | undefined {
  return MimeToFormat[mime];
}
