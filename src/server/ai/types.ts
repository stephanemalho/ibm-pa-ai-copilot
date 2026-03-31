import { z } from "zod";

const aiProviderValues = [
  "mock",
  "openai",
  "anthropic",
  "azure-openai",
  "watsonx",
] as const;

const aiProviderSchema = z.enum(aiProviderValues);

type AiProvider = z.infer<typeof aiProviderSchema>;

type AiProviderDefinition = {
  id: AiProvider;
  label: string;
  ready: boolean;
};

export { aiProviderSchema, aiProviderValues };
export type { AiProvider, AiProviderDefinition };
