"use client";

import { useMemo, type ReactNode } from "react";

import {
  getDimensionSemanticDescriptor,
  getMemberSemanticDescriptor,
} from "@/features/ibm-pa/lib/semantic";
import type { CubeComparatorResponse, CubeComparatorRow } from "@/shared/types/ibm-pa";
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
          tone={getDeltaTone(summary.netDelta).textClassName}
          value={formatSignedNumber(summary.netDelta)}
          supporting={`${summary.comparableRowCount}/${result.rows.length} comparable rows`}
        />
        <SummaryCard
          label="Net variance"
          tone={getDeltaTone(summary.netDelta).textClassName}
          value={formatVariance(summary.netVariancePercentage)}
          supporting={
            summary.totalBaseValue === null || summary.totalCompareValue === null
              ? "Not available for mixed or incomplete values"
              : "Computed from comparable totals"
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryChip label="Rows" value={result.rows.length.toString()} />
        <SummaryChip label="Mode" value={result.mode} />
        <SummaryChip
          label="Context filters"
          value={result.contextFilters.length.toString()}
        />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell
                  subtitle={result.rowDimensionName}
                  title={`Row — ${rowDimensionLabel}`}
                />
                <HeaderCell
                  align="right"
                  subtitle={result.baseMemberName}
                  title={`Base (A) — ${baseMemberLabel}`}
                />
                <HeaderCell
                  align="right"
                  subtitle={result.compareMemberName}
                  title={`Compare (B) — ${compareMemberLabel}`}
                />
                <HeaderCell align="right" title="Delta" />
                <HeaderCell align="right" title="Variance %" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => {
                const deltaTone = getDeltaTone(row.deltaValue);
                const varianceTone = getDeltaTone(getVarianceToneValue(row));
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
                          {row.rowMemberName}
                        </p>
                        {row.rowUniqueName ? (
                          <p className="text-xs text-slate-500">{row.rowUniqueName}</p>
                        ) : null}
                      </div>
                    </BodyCell>
                    <BodyCell align="right" numeric>
                      {formatMeasureValue(row.baseFormattedValue, row.baseValue)}
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
                          deltaTone.badgeClassName,
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
                          varianceTone.badgeClassName,
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
                {getDimensionSemanticDescriptor({
                  name: filter.dimensionName,
                }).displayLabel}
                : {getMemberSemanticDescriptor({ name: filter.memberName }).displayLabel}
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
  const comparableRows = rows.filter((row) => {
    return (
      getNumericValue(row.baseValue) !== null &&
      getNumericValue(row.compareValue) !== null
    );
  });

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
    return total + (getNumericValue(row.baseValue) ?? 0);
  }, 0);
  const totalCompareValue = comparableRows.reduce((total, row) => {
    return total + (getNumericValue(row.compareValue) ?? 0);
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

const formatMeasureValue = (
  formattedValue: string | null | undefined,
  rawValue: boolean | null | number | string,
): string => {
  const numericValue = getNumericValue(rawValue);

  if (numericValue !== null) {
    if (
      typeof formattedValue === "string" &&
      formattedValue.trim().length > 0 &&
      /[%$€£¥]/.test(formattedValue)
    ) {
      return formattedValue;
    }

    return formatNumber(numericValue);
  }

  if (formattedValue && formattedValue.trim().length > 0) {
    return formattedValue;
  }

  if (rawValue === null) {
    return "—";
  }

  return String(rawValue);
};

const formatSignedNumber = (value: number | null): string => {
  if (value === null) {
    return "—";
  }

  return formatNumber(value, {
    signDisplay: "exceptZero",
  });
};

const formatVariance = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  })}%`;
};

const formatNumber = (
  value: number,
  overrides?: Intl.NumberFormatOptions | undefined,
): string => {
  const absoluteValue = Math.abs(value);
  const minimumFractionDigits =
    absoluteValue !== 0 && absoluteValue < 1 ? 2 : 0;
  const maximumFractionDigits =
    absoluteValue !== 0 && absoluteValue < 1 ? 4 : 2;

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits,
    ...overrides,
  }).format(value);
};

const getNumericValue = (value: boolean | null | number | string): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const normalizedValue = value.replaceAll(",", "");
    const parsedValue = Number(normalizedValue);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
};

const getVarianceToneValue = (row: CubeComparatorRow): number | null => {
  if (row.variancePercentage === null || !Number.isFinite(row.variancePercentage)) {
    return null;
  }

  if (Math.abs(row.variancePercentage) < 0.001) {
    return 0;
  }

  return row.variancePercentage;
};

const getDeltaTone = (
  deltaValue: number | null,
): {
  badgeClassName: string;
  textClassName: string;
} => {
  if (deltaValue === null || Math.abs(deltaValue) < 0.001) {
    return {
      badgeClassName: "bg-slate-100 text-slate-700",
      textClassName: "text-slate-950",
    };
  }

  if (deltaValue > 0) {
    return {
      badgeClassName: "bg-emerald-50 text-emerald-800",
      textClassName: "text-emerald-900",
    };
  }

  return {
    badgeClassName: "bg-rose-50 text-rose-800",
    textClassName: "text-rose-900",
  };
};

export { ComparatorResultTable };
