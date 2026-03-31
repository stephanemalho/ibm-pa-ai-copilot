import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccessStatusBadge } from "@/features/ibm-pa/components/access-status-badge";
import type { ServerAccessibilityClassification } from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type AccessAwareCardProps = {
  accessible: boolean;
  classification: ServerAccessibilityClassification;
  href?: string | undefined;
  message?: string | undefined;
  metadata?: ReactNode;
  onClick?: (() => void) | undefined;
  selected?: boolean | undefined;
  subtitle?: string | undefined;
  title: string;
};

const AccessAwareCard = ({
  accessible,
  classification,
  href,
  message,
  metadata,
  onClick,
  selected = false,
  subtitle,
  title,
}: AccessAwareCardProps): ReactNode => {
  const cardBody = (
    <Card
      className={cn(
        "border transition-colors",
        accessible
          ? "border-emerald-300 bg-white shadow-sm hover:border-emerald-400"
          : "border-slate-200 bg-slate-100/70 text-slate-500",
        selected && accessible
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "",
      )}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-base leading-6">{title}</CardTitle>
            {subtitle ? (
              <CardDescription
                className={cn(accessible ? "text-slate-600" : "text-slate-500")}
              >
                {subtitle}
              </CardDescription>
            ) : null}
          </div>

          <AccessStatusBadge
            classification={classification}
            reachable={accessible}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 text-sm">
        {metadata}
        {message ? (
          <p
            className={cn(
              "text-xs leading-5",
              accessible ? "text-slate-500" : "text-slate-500",
            )}
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!accessible) {
    return <div className="cursor-not-allowed opacity-80">{cardBody}</div>;
  }

  if (href) {
    return (
      <Link
        className="block rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={href}
      >
        {cardBody}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        className="block w-full rounded-[1.5rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onClick}
        type="button"
      >
        {cardBody}
      </button>
    );
  }

  return cardBody;
};

export { AccessAwareCard };
