import type { ReactNode } from "react";

import { BusinessFlowCard } from "@/features/ibm-pa/components/business-flow-card";
import {
  getBusinessFlows,
  type BusinessFlowId,
} from "@/features/ibm-pa/lib/business-flows";
import { getBusinessFlowRoute } from "@/shared/lib/routes";

type BusinessFlowEntrySectionProps = {
  activeFlowId?: BusinessFlowId | undefined;
  description?: string | undefined;
  recommendations?: Partial<
    Record<
      BusinessFlowId,
      {
        note: string;
      }
    >
  >;
  serverName?: string | undefined;
  title?: string | undefined;
};

const BusinessFlowEntrySection = ({
  activeFlowId,
  description,
  recommendations,
  serverName,
  title,
}: BusinessFlowEntrySectionProps): ReactNode => {
  const flows = getBusinessFlows();

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-950">
          {title ?? "Guided business flows"}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {description ??
            "Start from a business intent, then let Xplorer guide you toward the most relevant cube and preview setup."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {flows.map((flow) => (
          <BusinessFlowCard
            flow={flow}
            href={getBusinessFlowRoute(flow.id, serverName)}
            isActive={flow.id === activeFlowId}
            key={flow.id}
            recommendation={recommendations?.[flow.id]}
          />
        ))}
      </div>
    </section>
  );
};

export { BusinessFlowEntrySection };
