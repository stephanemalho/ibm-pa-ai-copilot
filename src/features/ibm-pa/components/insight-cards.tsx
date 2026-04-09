"use client";

import type { ReactNode } from "react";

import type { AnalysisInsight } from "@/features/ibm-pa/lib/analysis-insights";
import { cn } from "@/shared/lib/utils";

type InsightCardsProps = {
  emptyDescription: string;
  emptyTitle: string;
  insights: AnalysisInsight[];
  title: string;
};

const InsightCards = ({
  emptyDescription,
  emptyTitle,
  insights,
  title,
}: InsightCardsProps): ReactNode => {
  if (insights.length === 0) {
    return (
      <EmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Lightweight signals derived directly from the current result set.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <div
            className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3"
            key={insight.id}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {insight.title}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {insight.valueLabel}
            </p>
            <p className={cn("mt-2 text-lg font-semibold", getToneClassName(insight.tone))}>
              {insight.metric}
            </p>
            {insight.supportingText ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {insight.supportingText}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

const EmptyState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

const getToneClassName = (
  tone: AnalysisInsight["tone"],
): string => {
  switch (tone) {
    case "positive":
      return "text-emerald-900";
    case "negative":
      return "text-rose-900";
    default:
      return "text-slate-950";
  }
};

export { InsightCards };
