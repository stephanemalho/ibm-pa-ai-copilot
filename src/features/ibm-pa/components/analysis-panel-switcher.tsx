"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type AnalysisPanelSwitcherProps = {
  activePanel: "preview" | "compare";
  onPanelChange: (panel: "preview" | "compare") => void;
};

const AnalysisPanelSwitcher = ({
  activePanel,
  onPanelChange,
}: AnalysisPanelSwitcherProps): ReactNode => {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
      <SwitcherButton
        isActive={activePanel === "preview"}
        label="Preview"
        onClick={() => {
          onPanelChange("preview");
        }}
      />
      <SwitcherButton
        isActive={activePanel === "compare"}
        label="Compare"
        onClick={() => {
          onPanelChange("compare");
        }}
      />
    </div>
  );
};

const SwitcherButton = ({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}): ReactNode => {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-600 hover:text-slate-950",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
};

export { AnalysisPanelSwitcher };
