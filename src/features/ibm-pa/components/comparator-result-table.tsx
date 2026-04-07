"use client";

import type { ReactNode } from "react";

import type { CubeComparatorResponse } from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type ComparatorResultTableProps = {
  result: CubeComparatorResponse;
};

const ComparatorResultTable = ({
  result,
}: ComparatorResultTableProps): ReactNode => {
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
                <HeaderCell>{result.rowDimensionName}</HeaderCell>
                <HeaderCell>{result.baseMemberName}</HeaderCell>
                <HeaderCell>{result.compareMemberName}</HeaderCell>
                <HeaderCell>Delta</HeaderCell>
                <HeaderCell>Variance %</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.rows.map((row) => {
                const deltaTone = getDeltaTone(row.deltaValue);
                const emphasize =
                  row.variancePercentage !== null &&
                  Math.abs(row.variancePercentage) >= 10;

                return (
                  <tr className="align-top" key={row.rowUniqueName ?? row.rowMemberName}>
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
                    <BodyCell>{formatCellValue(row.baseFormattedValue, row.baseValue)}</BodyCell>
                    <BodyCell>
                      {formatCellValue(row.compareFormattedValue, row.compareValue)}
                    </BodyCell>
                    <BodyCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 font-medium",
                          deltaTone.className,
                          emphasize ? "ring-2 ring-current/10" : "",
                        )}
                      >
                        {formatDelta(row.deltaValue)}
                      </span>
                    </BodyCell>
                    <BodyCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 font-medium",
                          deltaTone.className,
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
                {filter.dimensionName}: {filter.memberName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const HeaderCell = ({ children }: { children: ReactNode }): ReactNode => {
  return (
    <th className="px-4 py-3 text-left font-semibold text-slate-700">
      {children}
    </th>
  );
};

const BodyCell = ({ children }: { children: ReactNode }): ReactNode => {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
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

const formatCellValue = (
  formattedValue: string | null | undefined,
  rawValue: boolean | null | number | string,
): string => {
  return formattedValue ?? String(rawValue);
};

const formatDelta = (value: number | null): string => {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(value);
};

const formatVariance = (value: number | null): string => {
  if (value === null) {
    return "N/A";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(value)}%`;
};

const getDeltaTone = (
  deltaValue: number | null,
): {
  className: string;
} => {
  if (deltaValue === null || deltaValue === 0) {
    return {
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (deltaValue > 0) {
    return {
      className: "bg-emerald-50 text-emerald-800",
    };
  }

  return {
    className: "bg-rose-50 text-rose-800",
  };
};

export { ComparatorResultTable };
