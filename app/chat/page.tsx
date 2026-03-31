import type { ReactNode } from "react";

import { ChatShell } from "@/features/chat/components/chat-shell";
import { getChatPlaceholderMessages } from "@/features/chat/lib/get-chat-placeholder-messages";
import { getDefaultAiProvider } from "@/server/ai/provider-registry";
import { getIbmPaRuntimeConfig } from "@/server/ibm-pa/config";

const ChatPage = (): ReactNode => {
  const provider = getDefaultAiProvider();
  const ibmPaConfig = getIbmPaRuntimeConfig();
  const messages = getChatPlaceholderMessages();

  return (
    <ChatShell
      ibmPaConfigured={Boolean(ibmPaConfig)}
      messages={messages}
      providerLabel={provider.label}
    />
  );
};

export default ChatPage;
