import "server-only";

import {
  getIbmPaMode,
  getRequiredIbmPaEnv,
  hasRequiredIbmPaEnv,
  ibmPaEnv,
} from "@/server/ibm-pa/env";
import type { IbmPaRuntimeConfig } from "@/server/ibm-pa/types";

const getIbmPaRuntimeConfig = (): IbmPaRuntimeConfig => {
  if (!hasRequiredIbmPaEnv()) {
    return {
      isConfigured: false,
      mode: "mock",
      ...(ibmPaEnv.IBM_PA_TM1_SERVER
        ? {
            targetTm1Server: ibmPaEnv.IBM_PA_TM1_SERVER,
          }
        : {}),
    };
  }

  const liveEnv = getRequiredIbmPaEnv();

  return {
    baseUrl: liveEnv.IBM_PA_BASE_URL,
    isConfigured: true,
    mode: getIbmPaMode(),
    tenantId: liveEnv.IBM_PA_TENANT_ID,
    ...(liveEnv.IBM_PA_TM1_SERVER
      ? {
          targetTm1Server: liveEnv.IBM_PA_TM1_SERVER,
        }
      : {}),
  };
};

export { getIbmPaRuntimeConfig };
