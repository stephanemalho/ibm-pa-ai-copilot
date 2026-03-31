import "server-only";

import { z } from "zod";

import { IbmPaConfigurationError } from "@/server/ibm-pa/errors";

const emptyStringToUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
};

const ibmPaEnvSchema = z.object({
  IBM_PA_API_KEY: z.string().min(1).optional(),
  IBM_PA_BASE_URL: z.string().url().optional(),
  IBM_PA_TENANT_ID: z.string().min(1).optional(),
  IBM_PA_TM1_SERVER: z.string().min(1).optional(),
});

type IbmPaEnv = z.infer<typeof ibmPaEnvSchema>;

type RequiredIbmPaEnv = {
  IBM_PA_API_KEY: string;
  IBM_PA_BASE_URL: string;
  IBM_PA_TENANT_ID: string;
  IBM_PA_TM1_SERVER?: string;
};

const ibmPaEnv = ibmPaEnvSchema.parse({
  IBM_PA_API_KEY: emptyStringToUndefined(process.env.IBM_PA_API_KEY),
  IBM_PA_BASE_URL: emptyStringToUndefined(process.env.IBM_PA_BASE_URL),
  IBM_PA_TENANT_ID: emptyStringToUndefined(process.env.IBM_PA_TENANT_ID),
  IBM_PA_TM1_SERVER: emptyStringToUndefined(process.env.IBM_PA_TM1_SERVER),
});

const hasRequiredIbmPaEnv = (): boolean => {
  return Boolean(
    ibmPaEnv.IBM_PA_BASE_URL &&
    ibmPaEnv.IBM_PA_TENANT_ID &&
    ibmPaEnv.IBM_PA_API_KEY,
  );
};

const getIbmPaMode = (): "live" | "mock" => {
  return hasRequiredIbmPaEnv() ? "live" : "mock";
};

const getRequiredIbmPaEnv = (): RequiredIbmPaEnv => {
  if (
    !ibmPaEnv.IBM_PA_BASE_URL ||
    !ibmPaEnv.IBM_PA_TENANT_ID ||
    !ibmPaEnv.IBM_PA_API_KEY
  ) {
    throw new IbmPaConfigurationError(
      "IBM Planning Analytics live mode requires IBM_PA_BASE_URL, IBM_PA_TENANT_ID, and IBM_PA_API_KEY.",
    );
  }

  if (!ibmPaEnv.IBM_PA_TM1_SERVER) {
    return {
      IBM_PA_API_KEY: ibmPaEnv.IBM_PA_API_KEY,
      IBM_PA_BASE_URL: ibmPaEnv.IBM_PA_BASE_URL,
      IBM_PA_TENANT_ID: ibmPaEnv.IBM_PA_TENANT_ID,
    };
  }

  return {
    IBM_PA_API_KEY: ibmPaEnv.IBM_PA_API_KEY,
    IBM_PA_BASE_URL: ibmPaEnv.IBM_PA_BASE_URL,
    IBM_PA_TENANT_ID: ibmPaEnv.IBM_PA_TENANT_ID,
    IBM_PA_TM1_SERVER: ibmPaEnv.IBM_PA_TM1_SERVER,
  };
};

export { getIbmPaMode, getRequiredIbmPaEnv, hasRequiredIbmPaEnv, ibmPaEnv };
export type { IbmPaEnv, RequiredIbmPaEnv };
