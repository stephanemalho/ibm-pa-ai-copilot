"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";

type RecentCubesPanelProps = {
  currentServerName?: string | undefined;
  limit?: number | undefined;
};

const RecentCubesPanel = ({
  currentServerName,
  limit = 6,
}: RecentCubesPanelProps): ReactNode => {
  const { recentCubes } = useWorkspacePersistence();
  const visibleRecentCubes = recentCubes
    .slice()
    .sort((leftValue, rightValue) =>
      rightValue.viewedAt.localeCompare(leftValue.viewedAt),
    )
    .sort((leftValue, rightValue) => {
      if (!currentServerName) {
        return 0;
      }

      const leftIsCurrentServer = leftValue.serverName === currentServerName;
      const rightIsCurrentServer = rightValue.serverName === currentServerName;

      return Number(rightIsCurrentServer) - Number(leftIsCurrentServer);
    })
    .slice(0, limit);

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Recent cubes
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Resume recently opened cube workspaces without rebuilding the path.
        </p>
      </div>

      {visibleRecentCubes.length === 0 ? (
        <EmptyState
          description="No recent cube workspaces yet."
          title="No recent history"
        />
      ) : (
        <div className="space-y-2">
          {visibleRecentCubes.map((recentCube) => (
            <Link
              className="block rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={getCubeWorkspaceHref({
                cubeName: recentCube.cubeName,
                serverName: recentCube.serverName,
              })}
              key={`${recentCube.serverName}:${recentCube.cubeName}`}
            >
              <p className="truncate text-sm font-semibold text-slate-950">
                {recentCube.cubeName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {recentCube.serverName}
              </p>
            </Link>
          ))}
        </div>
      )}
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
    <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

export { RecentCubesPanel };
