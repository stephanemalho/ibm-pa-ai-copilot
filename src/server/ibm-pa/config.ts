import "server-only";

import { serverEnv } from "@/shared/env/server";

type IbmPaRuntimeConfig = {
  baseUrl: string;
  modelName?: string;
};

const getIbmPaRuntimeConfig = (): IbmPaRuntimeConfig | null => {
  if (!serverEnv.IBM_PA_BASE_URL) {
    return null;
  }

  if (!serverEnv.IBM_PA_MODEL_NAME) {
    return {
      baseUrl: serverEnv.IBM_PA_BASE_URL,
    };
  }

  return {
    baseUrl: serverEnv.IBM_PA_BASE_URL,
    modelName: serverEnv.IBM_PA_MODEL_NAME,
  };
};

export { getIbmPaRuntimeConfig };
export type { IbmPaRuntimeConfig };
