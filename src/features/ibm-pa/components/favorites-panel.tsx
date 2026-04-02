"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { FavoriteToggle } from "@/features/ibm-pa/components/favorite-toggle";
import { getCubeWorkspaceHref } from "@/features/ibm-pa/lib/cube-workspace-url-state";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";

type FavoritesPanelProps = {
  currentServerName?: string | undefined;
  limit?: number | undefined;
};

const FavoritesPanel = ({
  currentServerName,
  limit = 6,
}: FavoritesPanelProps): ReactNode => {
  const { favorites } = useWorkspacePersistence();
  const visibleFavorites = favorites
    .slice()
    .sort((leftValue, rightValue) =>
      rightValue.favoritedAt.localeCompare(leftValue.favoritedAt),
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
          Favorites
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Return quickly to the cubes you use most often.
        </p>
      </div>

      {visibleFavorites.length === 0 ? (
        <EmptyState
          description="No favorite cubes yet."
          title="No favorites"
        />
      ) : (
        <div className="space-y-2">
          {visibleFavorites.map((favorite) => (
            <div
              className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3"
              key={`${favorite.serverName}:${favorite.cubeName}`}
            >
              <Link
                className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={getCubeWorkspaceHref({
                  cubeName: favorite.cubeName,
                  serverName: favorite.serverName,
                })}
              >
                <p className="truncate text-sm font-semibold text-slate-950">
                  {favorite.cubeName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {favorite.serverName}
                </p>
              </Link>

              <FavoriteToggle
                className="h-9 px-3"
                cubeName={favorite.cubeName}
                serverName={favorite.serverName}
              />
            </div>
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

export { FavoritesPanel };
