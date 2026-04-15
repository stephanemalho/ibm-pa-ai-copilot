import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DiagnosticBadge } from "@/features/ibm-pa/components/diagnostic-badge";
import type { DiagnosticStatus } from "@/features/ibm-pa/lib/diagnostics";

type ResourceHealthPanelProps = {
  badges?: DiagnosticStatus[] | undefined;
  description: string;
  metrics: Array<{
    detail?: string | undefined;
    label: string;
    value: string;
  }>;
  title: string;
};

const ResourceHealthPanel = ({
  badges,
  description,
  metrics,
  title,
}: ResourceHealthPanelProps): ReactNode => {
  return (
    <Card className="border-slate-200/80 bg-white/90">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(badges ?? []).map((badge) => (
            <DiagnosticBadge
              key={`${badge.label}-${badge.tone}`}
              status={badge}
            />
          ))}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
            key={metric.label}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {metric.value}
            </p>
            {metric.detail ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {metric.detail}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export { ResourceHealthPanel };
