import type { ReactNode } from "react";

import type { ServerAccessibilityClassification } from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type AccessStatusBadgeProps = {
  classification: ServerAccessibilityClassification;
  reachable: boolean;
};

const AccessStatusBadge = ({
  classification,
  reachable,
}: AccessStatusBadgeProps): ReactNode => {
  const label = reachable ? "Accessible" : getFallbackLabel(classification);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        reachable
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-600",
      )}
    >
      {label}
    </span>
  );
};

const getFallbackLabel = (
  classification: ServerAccessibilityClassification,
): string => {
  switch (classification) {
    case "authenticated_but_not_authorized":
      return "Unauthorized";
    case "server_not_reachable_by_endpoint":
      return "Unavailable";
    case "unexpected_upstream_error":
      return "Error";
    default:
      return "Unavailable";
  }
};

export { AccessStatusBadge };
