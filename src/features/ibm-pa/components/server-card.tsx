import type { ReactNode } from "react";

import { AccessAwareCard } from "@/features/ibm-pa/components/access-aware-card";
import { getServerRoute } from "@/shared/lib/routes";
import type { ServerAccessibilityDiagnostic } from "@/shared/types/ibm-pa";

type ServerCardProps = {
  server: ServerAccessibilityDiagnostic;
};

const ServerCard = ({ server }: ServerCardProps): ReactNode => {
  return (
    <AccessAwareCard
      accessible={server.reachable}
      classification={server.classification}
      href={server.reachable ? getServerRoute(server.name) : undefined}
      message={server.message}
      metadata={
        <div className="space-y-1.5">
          <MetadataRow
            label="Explorer status"
            value={server.reachable ? "Ready for metadata" : "Visible only"}
          />
          <MetadataRow label="Resource type" value="TM1 server" />
          <MetadataRow
            label="Status code"
            value={server.statusCode?.toString() ?? "N/A"}
          />
        </div>
      }
      subtitle="TM1 server"
      title={server.name}
    />
  );
};

const MetadataRow = ({
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

export { ServerCard };
