"use client";

import type { ReactNode } from "react";

import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import { cn } from "@/shared/lib/utils";
import type { CubeDimensionStructureDiagnostic } from "@/shared/types/ibm-pa";

type CubeDimensionsTableProps = {
  dimensions: CubeDimensionStructureDiagnostic[];
  onSelectDimension: (dimensionName: string) => void;
  selectedDimensionName: string | null;
};

const CubeDimensionsTable = ({
  dimensions,
  onSelectDimension,
  selectedDimensionName,
}: CubeDimensionsTableProps): ReactNode => {
  if (dimensions.length === 0) {
    return (
      <EmptyState
        description="No dimensions were returned for this cube."
        title="No dimensions found"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <HeaderCell>Order</HeaderCell>
              <HeaderCell>Dimension</HeaderCell>
              <HeaderCell>Hierarchy</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Members</HeaderCell>
              <HeaderCell className="text-right">Inspect</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dimensions.map((dimension, index) => {
              const isSelected = dimension.name === selectedDimensionName;

              return (
                <tr
                  className={cn(
                    "transition-colors",
                    dimension.reachable
                      ? "hover:bg-emerald-50/50"
                      : "bg-slate-50/50 text-slate-500",
                    isSelected ? "bg-emerald-50/70" : "",
                  )}
                  key={dimension.name}
                >
                  <BodyCell>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                      {index + 1}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <div className="space-y-1">
                      <p
                        className={cn(
                          "font-semibold",
                          dimension.reachable ? "text-slate-950" : "text-slate-600",
                        )}
                      >
                        {dimension.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Structural dimension
                      </p>
                    </div>
                  </BodyCell>
                  <BodyCell>
                    {dimension.hierarchyName ?? "Primary hierarchy"}
                  </BodyCell>
                  <BodyCell>
                    <AccessStatusBadge
                      classification={dimension.classification}
                      reachable={dimension.reachable}
                    />
                  </BodyCell>
                  <BodyCell>
                    {dimension.reachable ? "Load on inspect" : "Unavailable"}
                  </BodyCell>
                  <BodyCell className="text-right">
                    {dimension.reachable ? (
                      <button
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                          isSelected
                            ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                            : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
                        )}
                        onClick={() => {
                          onSelectDimension(dimension.name);
                        }}
                        type="button"
                      >
                        {isSelected ? "Selected" : "Inspect"}
                      </button>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Disabled
                      </span>
                    )}
                  </BodyCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HeaderCell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}): ReactNode => {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-semibold text-slate-700",
        className,
      )}
    >
      {children}
    </th>
  );
};

const BodyCell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}): ReactNode => {
  return (
    <td className={cn("px-4 py-3 align-middle text-slate-700", className)}>
      {children}
    </td>
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

export { CubeDimensionsTable };
