import { getDefaultAiProvider } from "@/server/ai/provider-registry";
import { getIbmPaRuntimeConfig } from "@/server/ibm-pa/config";
import type { HealthcheckResponse } from "@/shared/types/health";

const getHealthcheckResponse = (): HealthcheckResponse => {
  const ibmPaRuntimeConfig = getIbmPaRuntimeConfig();

  return {
    status: "ok",
    service: "ibm-pa-ai-copilot",
    timestamp: new Date().toISOString(),
    defaultProvider: getDefaultAiProvider().id,
    ibmPaConfigured: ibmPaRuntimeConfig.isConfigured,
  };
};

export { getHealthcheckResponse };
