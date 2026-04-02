import Link from "next/link";
import type { ReactNode } from "react";

import type {
  BusinessFlowDefinition,
  BusinessFlowPreviewDefaults,
} from "@/features/ibm-pa/lib/business-flows";
import { getBusinessFlowRoute } from "@/shared/lib/routes";

type BusinessFlowContextBannerProps = {
  flow: BusinessFlowDefinition;
  previewDefaults?: BusinessFlowPreviewDefaults | undefined;
  serverName?: string | undefined;
};

const BusinessFlowContextBanner = ({
  flow,
  previewDefaults,
  serverName,
}: BusinessFlowContextBannerProps): ReactNode => {
  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Guided business flow
            </span>
            {flow.semanticTags.map((tag) => (
              <span
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">{flow.title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-700">
              {flow.description}
            </p>
          </div>
        </div>

        <Link
          className="text-sm font-medium text-emerald-900 underline-offset-4 hover:underline"
          href={getBusinessFlowRoute(flow.id, serverName)}
        >
          Reopen flow routing
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric
          label="Recommended row"
          value={previewDefaults?.previewRowDimensionName ?? "Choose the best time, measure, or entity axis"}
        />
        <Metric
          label="Suggested context"
          value={
            previewDefaults && previewDefaults.previewContextSelections.length > 0
              ? previewDefaults.previewContextSelections
                  .map((selection) => `${selection.dimensionName}: ${selection.memberName}`)
                  .join(" | ")
              : "Add planning context before running a preview"
          }
        />
        <Metric
          label="Fallback guidance"
          value={flow.fallbackHelpText}
        />
      </div>
    </section>
  );
};

const Metric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-white bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  );
};

export { BusinessFlowContextBanner };
