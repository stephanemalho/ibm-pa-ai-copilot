import type { ReactNode } from "react";

import type { DiagnosticStatus } from "@/features/ibm-pa/lib/diagnostics";
import { cn } from "@/shared/lib/utils";

type DiagnosticBadgeProps = {
  status: DiagnosticStatus;
};

const DiagnosticBadge = ({ status }: DiagnosticBadgeProps): ReactNode => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        getToneClassName(status.tone),
      )}
      title={status.detail}
    >
      {status.label}
    </span>
  );
};

const getToneClassName = (
  tone: DiagnosticStatus["tone"],
): string => {
  switch (tone) {
    case "good":
      return "bg-emerald-100 text-emerald-800";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "critical":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export { DiagnosticBadge };
