import "server-only";

import type { AiProvider, AiProviderDefinition } from "@/server/ai/types";
import { serverEnv } from "@/shared/env/server";

const providerRegistry: Record<AiProvider, AiProviderDefinition> = {
  mock: {
    id: "mock",
    label: "Mock provider",
    ready: true,
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    ready: false,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    ready: false,
  },
  "azure-openai": {
    id: "azure-openai",
    label: "Azure OpenAI",
    ready: false,
  },
  watsonx: {
    id: "watsonx",
    label: "IBM watsonx",
    ready: false,
  },
};

const getDefaultAiProvider = (): AiProviderDefinition => {
  return providerRegistry[serverEnv.AI_DEFAULT_PROVIDER];
};

export { getDefaultAiProvider, providerRegistry };
