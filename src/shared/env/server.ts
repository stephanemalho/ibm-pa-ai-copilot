import "server-only";

import { z } from "zod";

import { aiProviderSchema } from "@/server/ai/types";

const emptyStringToUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
};

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  AI_DEFAULT_PROVIDER: aiProviderSchema.default("mock"),
  IBM_PA_BASE_URL: z.string().url().optional(),
  IBM_PA_MODEL_NAME: z.string().min(1).optional(),
  HEALTHCHECK_TOKEN: z.string().min(1).optional(),
});

const serverEnv = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER,
  IBM_PA_BASE_URL: emptyStringToUndefined(process.env.IBM_PA_BASE_URL),
  IBM_PA_MODEL_NAME: emptyStringToUndefined(process.env.IBM_PA_MODEL_NAME),
  HEALTHCHECK_TOKEN: emptyStringToUndefined(process.env.HEALTHCHECK_TOKEN),
});

export { serverEnv };
