"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import type {
  CubeAccessibilityDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type SelectedDimensionPanelProps = {
  accessibleDimensionCount: number;
  dimensionCount: number;
  dimensionErrorMessage?: string | undefined;
  dimensionStatus: "error" | "idle" | "loading" | "success";
  selectedCube: CubeAccessibilityDiagnostic;
  selectedDimension: DimensionAccessibilityDiagnostic | null;
};

const membersPerPage = 8;

const SelectedDimensionPanel = ({
  accessibleDimensionCount,
  dimensionCount,
  dimensionErrorMessage,
  dimensionStatus,
  selectedCube,
  selectedDimension,
}: SelectedDimensionPanelProps): ReactNode => {
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberPage, setMemberPage] = useState(1);

  if (dimensionStatus === "loading") {
    return <LoadingState />;
  }

  if (dimensionStatus === "error") {
    return (
      <ErrorState
        description={
          dimensionErrorMessage ??
          "Dimension metadata could not be loaded for this cube."
        }
        title="Dimension metadata unavailable"
      />
    );
  }

  if (!selectedDimension) {
    return (
      <EmptyState
        description="Choose an accessible dimension to review its hierarchy and browse sample members."
        title="Select a dimension"
      />
    );
  }

  const normalizedMemberSearchTerm = memberSearchTerm.trim().toLowerCase();
  const filteredMembers = selectedDimension.members.filter((member) =>
    member.toLowerCase().includes(normalizedMemberSearchTerm),
  );
  const totalMemberPages =
    filteredMembers.length === 0
      ? 1
      : Math.ceil(filteredMembers.length / membersPerPage);
  const safeMemberPage = Math.min(memberPage, totalMemberPages);
  const paginatedMembers = filteredMembers.slice(
    (safeMemberPage - 1) * membersPerPage,
    safeMemberPage * membersPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <AccessStatusBadge
            classification={selectedDimension.classification}
            reachable={selectedDimension.reachable}
          />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Dimension explorer
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-slate-950">
            {selectedDimension.name}
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Explore the hierarchy and available sample members for this
            dimension within{" "}
            <span className="font-medium">{selectedCube.name}</span>.
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow
            label="Hierarchy"
            value={selectedDimension.hierarchyName ?? "Primary hierarchy"}
          />
          <DetailRow
            label="Visible members"
            value={selectedDimension.members.length.toString()}
          />
          <DetailRow
            label="Accessible dimensions"
            value={`${accessibleDimensionCount} of ${dimensionCount}`}
          />
          <DetailRow label="Cube" value={selectedCube.name} />
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Access diagnostics remain available in the list, while this panel
          focuses on exploration-ready metadata.
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>
            Search and page through the currently available sample members for
            this dimension.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="member-search"
            >
              Search members
            </label>
            <Input
              id="member-search"
              onChange={(event) => {
                setMemberSearchTerm(event.target.value);
                setMemberPage(1);
              }}
              placeholder="Filter members by name"
              value={memberSearchTerm}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              Showing{" "}
              <span className="font-medium text-slate-950">
                {filteredMembers.length === 0
                  ? 0
                  : (safeMemberPage - 1) * membersPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-950">
                {Math.min(
                  safeMemberPage * membersPerPage,
                  filteredMembers.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-950">
                {filteredMembers.length}
              </span>{" "}
              members
            </p>

            <div className="flex items-center gap-2">
              <Button
                disabled={safeMemberPage <= 1}
                onClick={() => {
                  setMemberPage((currentValue) =>
                    Math.max(currentValue - 1, 1),
                  );
                }}
                type="button"
                variant="secondary"
              >
                Previous
              </Button>
              <span className="min-w-24 text-center font-medium text-slate-700">
                Page {safeMemberPage} of {totalMemberPages}
              </span>
              <Button
                disabled={safeMemberPage >= totalMemberPages}
                onClick={() => {
                  setMemberPage((currentValue) =>
                    Math.min(currentValue + 1, totalMemberPages),
                  );
                }}
                type="button"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <EmptyState
              description="No members match the current search for this dimension."
              title="No matching members"
            />
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2">
                {paginatedMembers.map((member) => (
                  <div
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800"
                    key={member}
                  >
                    {member}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
};

const LoadingState = (): ReactNode => {
  return (
    <div className="space-y-4">
      <div className="h-5 w-36 rounded-full bg-slate-200" />
      <div className="h-28 rounded-2xl bg-slate-100" />
      <div className="h-40 rounded-2xl bg-slate-100" />
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

const ErrorState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
      <p className="font-medium text-rose-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
    </div>
  );
};

export { SelectedDimensionPanel };
