"use client";

import type { MouseEvent, ReactNode } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkspacePersistence } from "@/features/ibm-pa/lib/workspace-persistence";
import { cn } from "@/shared/lib/utils";

type FavoriteToggleProps = {
  cubeName: string;
  className?: string | undefined;
  serverName: string;
  showLabel?: boolean | undefined;
};

const FavoriteToggle = ({
  cubeName,
  className,
  serverName,
  showLabel = false,
}: FavoriteToggleProps): ReactNode => {
  const { isFavorite, toggleFavorite } = useWorkspacePersistence();
  const favorite = isFavorite({
    cubeName,
    serverName,
  });

  return (
    <Button
      aria-label={favorite ? "Remove favorite" : "Add favorite"}
      aria-pressed={favorite}
      className={cn(
        showLabel ? "gap-2 px-3" : "h-9 w-9 p-0",
        favorite
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "bg-white text-slate-700 hover:bg-slate-100",
        className,
      )}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite({
          cubeName,
          serverName,
        });
      }}
      type="button"
      variant="secondary"
    >
      <Star
        className={cn(
          "h-4 w-4",
          favorite ? "fill-current text-amber-700" : "text-slate-500",
        )}
      />
      {showLabel ? (favorite ? "Favorited" : "Favorite") : null}
    </Button>
  );
};

export { FavoriteToggle };
