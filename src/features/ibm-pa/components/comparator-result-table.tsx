"use client";

import { useMemo, type ReactNode } from "react";

import { InsightCards } from "@/features/ibm-pa/components/insight-cards";
import {
  formatCount,
  formatMeasureValue,
  formatSignedNumber,
  formatVariance,
  getInsightTone,
  getNumericComparatorRows,
} from "@/features/ibm-pa/lib/analysis-formatting";
import { deriveComparatorInsights } from "@/features/ibm-pa/lib/analysis-insights";
import {
  getDimensionSemanticDescriptor,
  getMemberSemanticDescriptor,
} from "@/features/ibm-pa/lib/semantic";
import type {
  CubeComparatorResponse,
  CubeComparatorRow,
} from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type ComparatorResultTableProps = {
  result: CubeComparatorResponse;
};

type ComparisonSummary = {
  comparableRowCount: number;
  netDelta: number | null;
  netVariancePercentage: number | null;
  totalBaseValue: number | null;
  totalCompareValue: number | null;
};

const ComparatorResultTable = ({
  result,
}: ComparatorResultTableProps): ReactNode => {
  const rowDimensionLabel = getDimensionSemanticDescriptor({
    name: result.rowDimensionName,
  }).displayLabel;
  const baseMemberLabel = getMemberSemanticDescriptor({
    name: result.baseMemberName,
  }).displayLabel;
  const compareMemberLabel = getMemberSemanticDescriptor({
    name: result.compareMemberName,
  }).displayLabel;
  const summary = useMemo(() => {
    return getComparisonSummary(result.rows);
  }, [result.rows]);
  const insights = useMemo(() => {
    return deriveComparatorInsights(result);
  }, [result]);

  if (result.rows.length === 0) {
    return (
      <EmptyState
        description="The comparison ran successfully, but no comparable rows were returned."
        title="No comparison rows"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Base (A)"
          value={baseMemberLabel}
          supporting={result.baseMemberName}
        />
        <SummaryCard
          label="Compare (B)"
          value={compareMemberLabel}
          supporting={result.compareMemberName}
        />
        <SummaryCard
          label="Net delta"
          tone={getToneTextClassName(getInsightTone(summary.netDelta))}
          value={formatSignedNumber(summary.netDelta)}
          supporting={`${formatCount(summary.comparableRowCount)} of ${formatCount(result.rows.length)} rows comparable`}
        />
        <SummaryCard
          label="Net variance"
          tone={getToneTextClassName(
            getInsightTone(summary.netVariancePercentage),
          )}
          value={formatVariance(summary.netVariancePercentage)}
          supporting={
            summary.totalBaseValue === null ||
            summary.totalCompareValue === null
              ? "Not available for mixed or incomplete values"
              : "Computed from comparable totals"
          }
        />
      </div>

      <InsightCards
        emptyDescription="No comparison insights available for this result."
        emptyTitle="No comparison insights"
        insights={insights}
        title="Comparison insights"
      />

      <div className="flex flex-wrap gap-3">
        <SummaryChip label="Rows" value={formatCount(result.rows.length)} />
        <SummaryChip label="Mode" value={result.mode} />
        <SummaryChip
          label="Context filters"
          value={formatCount(result.contextFilters.length)}
        />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell
                  subtitle={result.rowDimensionName}
                  title={`Row - ${rowDimensionLabel}`}
                />
                <HeaderCell
                  align="right"
                  subtitle={result.baseMemberName}
                  title={`Base (A) - ${baseMemberLabel}`}
                />
                <HeaderCell
                  align="right"
                  subtitle={result.compareMemberName}
                  title={`Compare (B) - ${compareMemberLabel}`}
                />
                <HeaderCell align="right" title="Delta" />
                <HeaderCell align="right" title="Variance %" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => {
                const deltaTone = getInsightTone(row.deltaValue);
                const varianceTone = getInsightTone(row.variancePercentage);
                const emphasize =
                  row.variancePercentage !== null &&
                  Math.abs(row.variancePercentage) >= 10;

                return (
                  <tr
                    className="align-top"
                    key={row.rowUniqueName ?? row.rowMemberName}
                  >
                    <BodyCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">
                          {
                            getMemberSemanticDescriptor({
                              name: row.rowMemberName,
                            }).displayLabel
                          }
                        </p>
                        {row.rowUniqueName ? (
                          <p className="text-xs text-slate-500">
                            {row.rowUniqueName}
                          </p>
                        ) : null}
                      </div>
                    </BodyCell>
                    <BodyCell align="right" numeric>
                      {formatMeasureValue(
                        row.baseFormattedValue,
                        row.baseValue,
                      )}
                    </BodyCell>
                    <BodyCell align="right" numeric>
                      {formatMeasureValue(
                        row.compareFormattedValue,
                        row.compareValue,
                      )}
                    </BodyCell>
                    <BodyCell align="right" numeric>
                      <span
                        className={cn(
                          "inline-flex min-w-24 justify-end rounded-full px-3 py-1 font-medium tabular-nums",
                          getToneBadgeClassName(deltaTone),
                          emphasize ? "ring-2 ring-current/10" : "",
                        )}
                      >
                        {formatSignedNumber(row.deltaValue)}
                      </span>
                    </BodyCell>
                    <BodyCell align="right" numeric>
                      <span
                        className={cn(
                          "inline-flex min-w-24 justify-end rounded-full px-3 py-1 font-medium tabular-nums",
                          getToneBadgeClassName(varianceTone),
                          emphasize ? "ring-2 ring-current/10" : "",
                        )}
                      >
                        {formatVariance(row.variancePercentage)}
                      </span>
                    </BodyCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {result.contextFilters.length > 0 ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Fixed context</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.contextFilters.map((filter) => (
              <span
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                key={`${filter.dimensionName}-${filter.memberName}`}
              >
                {
                  getDimensionSemanticDescriptor({
                    name: filter.dimensionName,
                  }).displayLabel
                }
                :{" "}
                {
                  getMemberSemanticDescriptor({ name: filter.memberName })
                    .displayLabel
                }
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const HeaderCell = ({
  align = "left",
  subtitle,
  title,
}: {
  align?: "left" | "right";
  subtitle?: string | undefined;
  title: string;
}): ReactNode => {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-slate-700",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <div className="space-y-1">
        <p>{title}</p>
        {subtitle ? (
          <p className="text-xs font-normal text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </th>
  );
};

const BodyCell = ({
  align = "left",
  children,
  numeric = false,
}: {
  align?: "left" | "right";
  children: ReactNode;
  numeric?: boolean | undefined;
}): ReactNode => {
  return (
    <td
      className={cn(
        "px-4 py-3 text-slate-700",
        align === "right" ? "text-right" : "text-left",
        numeric ? "tabular-nums" : "",
      )}
    >
      {children}
    </td>
  );
};

const SummaryCard = ({
  label,
  supporting,
  tone,
  value,
}: {
  label: string;
  supporting: string;
  tone?: string | undefined;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-2 text-base font-semibold text-slate-950", tone)}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{supporting}</p>
    </div>
  );
};

const SummaryChip = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-950">{value}</span> {label}
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
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

const getComparisonSummary = (rows: CubeComparatorRow[]): ComparisonSummary => {
  const comparableRows = getNumericComparatorRows(rows);

  if (comparableRows.length !== rows.length || comparableRows.length === 0) {
    return {
      comparableRowCount: comparableRows.length,
      netDelta: null,
      netVariancePercentage: null,
      totalBaseValue: null,
      totalCompareValue: null,
    };
  }

  const totalBaseValue = comparableRows.reduce((total, row) => {
    return total + row.baseNumericValue;
  }, 0);
  const totalCompareValue = comparableRows.reduce((total, row) => {
    return total + row.compareNumericValue;
  }, 0);
  const netDelta = totalCompareValue - totalBaseValue;
  const netVariancePercentage =
    totalBaseValue === 0 ? null : (netDelta / totalBaseValue) * 100;

  return {
    comparableRowCount: comparableRows.length,
    netDelta,
    netVariancePercentage,
    totalBaseValue,
    totalCompareValue,
  };
};

const getToneBadgeClassName = (
  tone: "negative" | "neutral" | "positive",
): string => {
  switch (tone) {
    case "positive":
      return "bg-emerald-50 text-emerald-800";
    case "negative":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getToneTextClassName = (
  tone: "negative" | "neutral" | "positive",
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

export { ComparatorResultTable };
