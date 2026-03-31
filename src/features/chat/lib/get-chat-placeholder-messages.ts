import type { ChatMessage } from "@/shared/types/chat";

const getChatPlaceholderMessages = (): ChatMessage[] => {
  const createdAt = new Date().toISOString();

  return [
    {
      id: "assistant-intro",
      role: "assistant",
      content:
        "Hello. I am the placeholder copilot shell for IBM Planning Analytics workflows. Provider wiring and IBM-specific capabilities will be added in the next step.",
      createdAt,
    },
    {
      id: "user-example",
      role: "user",
      content:
        "Show me the latest revenue variance drivers for the current planning version.",
      createdAt,
    },
  ];
};

export { getChatPlaceholderMessages };
