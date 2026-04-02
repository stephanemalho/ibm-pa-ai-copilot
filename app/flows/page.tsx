import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessFlowEntrySection } from "@/features/ibm-pa/components/business-flow-entry-section";
import { getServerAccessibilityDiagnostics } from "@/server/ibm-pa/client";

export const dynamic = "force-dynamic";

const BusinessFlowsPage = async (): Promise<ReactNode> => {
  const serverDiagnostics = await getServerAccessibilityDiagnostics();
  const accessibleServerCount = serverDiagnostics.servers.filter(
    (server) => server.reachable,
  ).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] xl:p-10">
        <div className="space-y-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Business-first entry
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Guided Business Flows
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            Start from the business question you want to explore, then let
            Analytics Copilot Xplorer route you into the most relevant cube
            workspace with supportive defaults.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-slate-950 text-slate-50">
          <CardHeader>
            <CardTitle>Flow readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <p>Configured flows: 4</p>
            <p>Discovered servers: {serverDiagnostics.servers.length}</p>
            <p>Accessible servers: {accessibleServerCount}</p>
            <p>Mode: {serverDiagnostics.mode}</p>
          </CardContent>
        </Card>
      </section>

      <BusinessFlowEntrySection />
    </div>
  );
};

export default BusinessFlowsPage;
