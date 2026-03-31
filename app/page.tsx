import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appRoutes } from "@/shared/lib/routes";
import { siteConfig } from "@/shared/lib/site";

const highlights = [
  {
    title: "IBM Planning Analytics ready",
    description:
      "The server boundary is in place for future IBM PA clients, auth, and domain adapters.",
  },
  {
    title: "Provider-agnostic AI seam",
    description:
      "The AI layer is scaffolded so Vercel AI SDK and multiple LLM providers can plug in cleanly.",
  },
  {
    title: "Pragmatic TypeScript baseline",
    description:
      "Strict typing, runtime validation, official Next.js linting, and a small UI foundation are already wired.",
  },
] as const;

const HomePage = (): ReactNode => {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1.3fr_0.7fr] lg:p-12">
        <div className="space-y-6">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-slate-50">
            Next.js App Router POC
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              A production-minded starting point for an internal copilot that
              can evolve toward IBM Planning Analytics workflows, streaming
              chat, and swappable LLM providers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={appRoutes.chat}>Open chat placeholder</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={appRoutes.health}>Check health route</Link>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Step 1 deliverable</CardTitle>
            <CardDescription className="text-slate-300">
              The scaffold is intentionally lean so future agent work can stay
              clear and easy to reason about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <p>App routes are thin.</p>
            <p>Environment validation is explicit.</p>
            <p>
              IBM PA and AI seams are prepared, not prematurely implemented.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <Card key={highlight.title}>
            <CardHeader>
              <CardTitle className="text-xl">{highlight.title}</CardTitle>
              <CardDescription>{highlight.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
