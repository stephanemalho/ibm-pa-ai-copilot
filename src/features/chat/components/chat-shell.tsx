import { Bot, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChatMessage } from "@/shared/types/chat";

type ChatShellProps = {
  ibmPaConfigured: boolean;
  messages: ChatMessage[];
  providerLabel: string;
};

const ChatShell = ({
  ibmPaConfigured,
  messages,
  providerLabel,
}: ChatShellProps): ReactNode => {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <span className="rounded-full bg-accent p-2 text-accent-foreground">
              <Bot className="size-5" />
            </span>
            Chat placeholder
          </CardTitle>
          <CardDescription>
            This route is ready for the next step: wire a real chat request
            pipeline and stream responses through a provider-agnostic server
            layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((message) => (
            <div
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700"
              key={message.id}
            >
              <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                {message.role}
              </div>
              <p>{message.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Sparkles className="size-5 text-primary" />
              Runtime summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-950">
                Default provider:
              </span>{" "}
              {providerLabel}
            </p>
            <p>
              <span className="font-medium text-slate-950">
                IBM PA configured:
              </span>{" "}
              {ibmPaConfigured ? "Yes" : "Not yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Next integration targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-slate-700">
            <p>Add IBM Planning Analytics auth and query clients.</p>
            <p>Introduce Vercel AI SDK orchestration in `src/server/ai/`.</p>
            <p>
              Replace placeholder messages with real server actions or route
              handlers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { ChatShell };
