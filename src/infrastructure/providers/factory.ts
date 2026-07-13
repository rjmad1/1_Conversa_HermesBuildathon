import OpenAI from "openai";
import type { AppEnv } from "../../shared/config/env";
import { FakeTranscriptionProvider } from "../providers/fake-transcription";
import { FakeAnalysisProvider } from "../providers/fake-analysis";
import { OpenAITranscriptionProvider, OpenAIAnalysisProvider } from "../providers/openai";
import { AnthropicAnalysisProvider, FailoverAnalysisProvider } from "../providers/anthropic";
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
    const client = new OpenAI({ apiKey: key });
    return {
      transcription: new OpenAITranscriptionProvider(client, cfg.TRANSCRIPTION_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES),
      analysis: buildAnalysis(cfg, client),
    };
  }
  return { transcription: new FakeTranscriptionProvider(), analysis: new FakeAnalysisProvider() };
}

function buildAnalysis(cfg: AppEnv, client: OpenAI): MeetingAnalysisProvider {
  if (cfg.ANALYSIS_PROVIDER === "openai") {
    const primary = new OpenAIAnalysisProvider(client, cfg.ANALYSIS_MODEL, cfg.PROVIDER_TIMEOUT_MS, cfg.PROVIDER_MAX_RETRIES);
    const secondary = new AnthropicAnalysisProvider(cfg.ANTHROPIC_API_KEY);
    return new FailoverAnalysisProvider(primary, secondary);
  }
  return new FakeAnalysisProvider();
}
