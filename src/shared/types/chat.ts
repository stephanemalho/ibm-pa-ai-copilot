type ChatRole = "assistant" | "system" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type { ChatMessage, ChatRole };
