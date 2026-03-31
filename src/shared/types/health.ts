import type { AiProvider } from "@/server/ai/types";

type HealthcheckResponse = {
  status: "ok";
  service: string;
  timestamp: string;
  defaultProvider: AiProvider;
  ibmPaConfigured: boolean;
};

export type { HealthcheckResponse };
