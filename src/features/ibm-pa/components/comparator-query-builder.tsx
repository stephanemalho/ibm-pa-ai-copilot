"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CompareMemberSelector } from "@/features/ibm-pa/components/compare-member-selector";
import {
  getDimensionSemanticDescriptor,
  getMemberSemanticDescriptor,
} from "@/features/ibm-pa/lib/semantic";
import type { DimensionAccessibilityDiagnostic } from "@/shared/types/ibm-pa";

type ComparatorQueryBuilderProps = {
  canRunComparison: boolean;
  comparisonDimension: DimensionAccessibilityDiagnostic | null;
  comparisonDimensionName: string | null;
  contextDimensions: DimensionAccessibilityDiagnostic[];
  contextSelections: Record<string, string>;
  isLoading: boolean;
  onBaseMemberChange: (memberName: string) => void;
  onCompare: () => void;
  onCompareMemberChange: (memberName: string) => void;
  onComparisonDimensionChange: (dimensionName: string) => void;
  onContextSelectionChange: (dimensionName: string, memberName: string) => void;
  onRowDimensionChange: (dimensionName: string) => void;
  onSwapMembers: () => void;
  rowDimensionName: string | null;
  selectedBaseMemberName: string;
  selectedCompareMemberName: string;
  selectableComparisonDimensions: DimensionAccessibilityDiagnostic[];
  selectableRowDimensions: DimensionAccessibilityDiagnostic[];
};

const ComparatorQueryBuilder = ({
  canRunComparison,
  comparisonDimension,
  comparisonDimensionName,
  contextDimensions,
  contextSelections,
  isLoading,
  onBaseMemberChange,
  onCompare,
  onCompareMemberChange,
  onComparisonDimensionChange,
  onContextSelectionChange,
  onRowDimensionChange,
  onSwapMembers,
  rowDimensionName,
  selectedBaseMemberName,
  selectedCompareMemberName,
  selectableComparisonDimensions,
  selectableRowDimensions,
}: ComparatorQueryBuilderProps): ReactNode => {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Guided comparator
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Put the business list you want to scan on rows, choose one dimension
          to compare A versus B, then keep the remaining dimensions fixed as
          context.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Field label="Row dimension">
          <Select
            onChange={(event) => {
              onRowDimensionChange(event.target.value);
            }}
            value={rowDimensionName ?? ""}
          >
            {selectableRowDimensions.map((dimension) => (
              <option key={dimension.name} value={dimension.name}>
                {getDimensionSemanticDescriptor(dimension).displayLabel}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Comparison dimension">
          <Select
            onChange={(event) => {
              onComparisonDimensionChange(event.target.value);
            }}
            value={comparisonDimensionName ?? ""}
          >
            {selectableComparisonDimensions.map((dimension) => (
              <option key={dimension.name} value={dimension.name}>
                {getDimensionSemanticDescriptor(dimension).displayLabel}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {comparisonDimension ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-end">
            <CompareMemberSelector
              label="Base value (A)"
              members={comparisonDimension.members}
              onChange={onBaseMemberChange}
              value={selectedBaseMemberName}
            />
            <div className="flex justify-center xl:pb-1">
              <Button
                disabled={
                  !selectedBaseMemberName ||
                  !selectedCompareMemberName ||
                  isLoading
                }
                onClick={onSwapMembers}
                type="button"
                variant="ghost"
              >
                Swap A / B
              </Button>
            </div>
            <CompareMemberSelector
              label="Compare value (B)"
              members={comparisonDimension.members}
              onChange={onCompareMemberChange}
              value={selectedCompareMemberName}
            />
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            The row dimension defines the lines of the result table. The
            comparison dimension defines the two members being contrasted.
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <p className="text-sm font-medium text-slate-700">Context members</p>
        {contextDimensions.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
            No extra context member is required for this comparison.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {contextDimensions.map((dimension) => {
              const semantic = getDimensionSemanticDescriptor(dimension);
              const selectedMember =
                contextSelections[dimension.name] ??
                dimension.members[0]?.name ??
                "";

              return (
                <Field
                  key={dimension.name}
                  label={`${semantic.displayLabel}${dimension.members.length > 0 ? ` (${dimension.members.length} sample members)` : ""}`}
                >
                  <Select
                    disabled={dimension.members.length === 0}
                    onChange={(event) => {
                      onContextSelectionChange(
                        dimension.name,
                        event.target.value,
                      );
                    }}
                    value={selectedMember}
                  >
                    {dimension.members.map((member) => (
                      <option
                        key={member.uniqueName ?? member.name}
                        value={member.name}
                      >
                        {getMemberSemanticDescriptor(member).displayLabel}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-600">
          {comparisonDimension ? (
            <p>
              Comparing{" "}
              <span className="font-medium text-slate-950">
                {
                  getMemberSemanticDescriptor(
                    comparisonDimension.members.find(
                      (member) => member.name === selectedBaseMemberName,
                    ) ?? {
                      name: selectedBaseMemberName,
                    },
                  ).displayLabel
                }
              </span>{" "}
              against{" "}
              <span className="font-medium text-slate-950">
                {
                  getMemberSemanticDescriptor(
                    comparisonDimension.members.find(
                      (member) => member.name === selectedCompareMemberName,
                    ) ?? {
                      name: selectedCompareMemberName,
                    },
                  ).displayLabel
                }
              </span>
            </p>
          ) : (
            <p>Select a comparison dimension with at least two members.</p>
          )}
        </div>

        <Button
          disabled={!canRunComparison || isLoading}
          onClick={onCompare}
          type="button"
        >
          {isLoading ? "Comparing..." : "Run comparison"}
        </Button>
      </div>
    </div>
  );
};

const Field = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}): ReactNode => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
};

export { ComparatorQueryBuilder };
