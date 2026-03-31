import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServerStatusBadge } from "@/features/ibm-pa/components/server-status-badge";
import { getServerRoute } from "@/shared/lib/routes";
import type { ServerAccessibilityDiagnostic } from "@/shared/types/ibm-pa";
import { cn } from "@/shared/lib/utils";

type ServerCardProps = {
  server: ServerAccessibilityDiagnostic;
};

const ServerCard = ({ server }: ServerCardProps): ReactNode => {
  const cardContent = (
    <Card
      className={cn(
        "h-full border-2 transition-colors",
        server.reachable
          ? "border-emerald-300 bg-white"
          : "border-slate-200 bg-slate-100/70 text-slate-500",
      )}
    >
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{server.name}</CardTitle>
            <CardDescription
              className={cn(
                "max-w-md",
                server.reachable ? "text-slate-600" : "text-slate-500",
              )}
            >
              {server.message}
            </CardDescription>
          </div>

          <ServerStatusBadge server={server} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium text-slate-900">Metadata access:</span>{" "}
          {server.reachable ? "Available" : "Unavailable"}
        </p>
        <p>
          <span className="font-medium text-slate-900">Upstream status:</span>{" "}
          {server.statusCode ?? "N/A"}
        </p>
      </CardContent>
    </Card>
  );

  if (!server.reachable) {
    return <div className="cursor-not-allowed opacity-80">{cardContent}</div>;
  }

  return (
    <Link
      className="block h-full rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={getServerRoute(server.name)}
    >
      {cardContent}
    </Link>
  );
};

export { ServerCard };
