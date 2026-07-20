import {
  CapabilityRequest,
  ICapabilityRouter,
  IProviderAdapter,
  RoutingDecision
} from "../contracts/ai-runtime-contract";

export class CapabilityRouter implements ICapabilityRouter {
  public selectProvider(
    request: CapabilityRequest,
    availableProviders: IProviderAdapter[]
  ): RoutingDecision {
    if (!availableProviders || availableProviders.length === 0) {
      throw new Error(`[CapabilityRouter] No AI providers registered in AI Runtime.`);
    }

    const requestedQuality = request.qualityTier || "Balanced";
    const requestedPrivacy = request.privacyLevel || "Internal";

    const eligibleProviders = availableProviders.filter((p) => {
      const descriptors = p.getCapabilities();
      return descriptors.some((desc) => {
        if (desc.capability !== request.capability || !desc.isAvailable) return false;

        if (desc.supportedQualityTiers && desc.supportedQualityTiers.length > 0) {
          if (!desc.supportedQualityTiers.includes(requestedQuality)) return false;
        }

        if (desc.privacySupported && desc.privacySupported.length > 0) {
          if (!desc.privacySupported.includes(requestedPrivacy)) return false;
        }

        return true;
      });
    });

    const chosenProvider = (eligibleProviders.length > 0 ? eligibleProviders[0] : availableProviders[0])!;
    const desc = chosenProvider.getCapabilities().find((d) => d.capability === request.capability);

    const estCost = desc?.costPer1kTokens
      ? (desc.costPer1kTokens * 1.5) / 1000
      : (desc?.costPerAudioMinute || 0.005) * 5;

    return {
      selectedProviderId: chosenProvider.id,
      selectedModelId: `${chosenProvider.id}-${request.capability.toLowerCase()}-${requestedQuality.toLowerCase()}`,
      estimatedCostUsd: Number(estCost.toFixed(5)),
      routingReason: `Selected provider '${chosenProvider.name}' for capability '${request.capability}' [Quality: ${requestedQuality}, Privacy: ${requestedPrivacy}].`,
    };
  }
}
