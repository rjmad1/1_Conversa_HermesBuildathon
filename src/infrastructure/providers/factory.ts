import type { AppEnv } from "../../shared/config/env";
import { FakeTranscriptionProvider } from "../providers/fake-transcription";
import { FakeAnalysisProvider } from "../providers/fake-analysis";
import { OpenAITranscriptionProvider } from "../providers/openai";
import type { AudioTranscriptionProvider } from "../../modules/transcription/domain/provider";
import type { MeetingAnalysisProvider } from "../../modules/analysis/domain/provider";

export interface ProviderBundle {
  transcription: AudioTranscriptionProvider;
  analysis: MeetingAnalysisProvider;
}

export function buildProviders(cfg: AppEnv): ProviderBundle {
  if (cfg.TRANSCRIPTION_PROVIDER === "openai") {
    const key = cfg.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required for openai transcription provider");
    const client = new (await import("openai")).default({ apiKey: key });
    return {
      transcription: new OpenAITranscriptionProvider(client, cfg.TRANSCRIPTION_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES),
      analysis: buildAnalysis(cfg, client),
    };
  }
  return { transcription: new FakeTranscriptionProvider(), analysis: new FakeAnalysisProvider() };
}

function buildAnalysis(cfg: AppEnv, client: import("openai").default): MeetingAnalysisProvider {
  if (cfg.ANALYSIS_PROVIDER === "openai") {
    return new (await import("./openai")).OpenAIAnalysisProvider(client, cfg.ANALYSIS_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES);
  }
  return new FakeAnalysisProvider();
}
