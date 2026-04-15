"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import type {
  FavoriteCube,
  RecentCube,
  SavedView,
  WorkspacePreviewContextSelection,
} from "@/features/ibm-pa/lib/workspace-state-types";

const favoriteCubeSchema = z.object({
  cubeName: z.string().trim().min(1),
  favoritedAt: z.string().trim().min(1),
  serverName: z.string().trim().min(1),
});

const recentCubeSchema = z.object({
  cubeName: z.string().trim().min(1),
  serverName: z.string().trim().min(1),
  viewedAt: z.string().trim().min(1),
});

const previewContextSelectionSchema = z.object({
  dimensionName: z.string().trim().min(1),
  memberName: z.string().trim().min(1),
});

const savedViewSchema = z.object({
  createdAt: z.string().trim().min(1),
  cubeName: z.string().trim().min(1),
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  previewContextSelections: z.array(previewContextSelectionSchema),
  previewRowDimensionName: z.string().trim().min(1).optional(),
  selectedDimensionName: z.string().trim().min(1).optional(),
  serverName: z.string().trim().min(1),
});

const workspacePersistenceStateSchema = z.object({
  favorites: z.array(favoriteCubeSchema).default([]),
  recentCubes: z.array(recentCubeSchema).default([]),
  savedViews: z.array(savedViewSchema).default([]),
});

type WorkspacePersistenceState = {
  favorites: FavoriteCube[];
  recentCubes: RecentCube[];
  savedViews: SavedView[];
};

type SaveViewInput = {
  cubeName: string;
  name?: string | undefined;
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
  serverName: string;
};

const storageKey = "ibm-pa-workspace-state-v1";
const storageChangeEventName = "ibm-pa-workspace-state-changed";
const maxRecentCubes = 8;
const maxSavedViews = 25;

const emptyState: WorkspacePersistenceState = {
  favorites: [],
  recentCubes: [],
  savedViews: [],
};

const useWorkspacePersistence = () => {
  const [state, setState] = useState<WorkspacePersistenceState>(emptyState);

  useEffect(() => {
    const syncState = (): void => {
      setState(readWorkspacePersistenceState());
    };
    const initialSyncHandle = window.setTimeout(syncState, 0);

    window.addEventListener(storageChangeEventName, syncState);
    window.addEventListener("storage", syncState);

    return () => {
      window.clearTimeout(initialSyncHandle);
      window.removeEventListener(storageChangeEventName, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  const updateState = useCallback(
    (
      updater: (
        currentValue: WorkspacePersistenceState,
      ) => WorkspacePersistenceState,
    ) => {
      const nextState = updater(readWorkspacePersistenceState());

      writeWorkspacePersistenceState(nextState);
      setState(nextState);
    },
    [],
  );

  const isFavorite = useCallback(
    (params: { cubeName: string; serverName: string }): boolean => {
      return state.favorites.some(
        (favorite) =>
          favorite.cubeName === params.cubeName &&
          favorite.serverName === params.serverName,
      );
    },
    [state.favorites],
  );

  const toggleFavorite = useCallback(
    (params: { cubeName: string; serverName: string }): void => {
      updateState((currentValue) => {
        const existingFavorite = currentValue.favorites.some(
          (favorite) =>
            favorite.cubeName === params.cubeName &&
            favorite.serverName === params.serverName,
        );

        if (existingFavorite) {
          return {
            ...currentValue,
            favorites: currentValue.favorites.filter(
              (favorite) =>
                !(
                  favorite.cubeName === params.cubeName &&
                  favorite.serverName === params.serverName
                ),
            ),
          };
        }

        return {
          ...currentValue,
          favorites: [
            {
              cubeName: params.cubeName,
              favoritedAt: new Date().toISOString(),
              serverName: params.serverName,
            },
            ...currentValue.favorites,
          ],
        };
      });
    },
    [updateState],
  );

  const addRecentCube = useCallback(
    (params: { cubeName: string; serverName: string }): void => {
      updateState((currentValue) => {
        const nextRecentCubes = [
          {
            cubeName: params.cubeName,
            serverName: params.serverName,
            viewedAt: new Date().toISOString(),
          },
          ...currentValue.recentCubes.filter(
            (recentCube) =>
              !(
                recentCube.cubeName === params.cubeName &&
                recentCube.serverName === params.serverName
              ),
          ),
        ].slice(0, maxRecentCubes);

        return {
          ...currentValue,
          recentCubes: nextRecentCubes,
        };
      });
    },
    [updateState],
  );

  const saveView = useCallback(
    (input: SaveViewInput): SavedView => {
      const savedView: SavedView = {
        createdAt: new Date().toISOString(),
        cubeName: input.cubeName,
        id: createSavedViewId(),
        name:
          input.name?.trim() ||
          createDefaultSavedViewName({
            cubeName: input.cubeName,
            selectedDimensionName: input.selectedDimensionName,
          }),
        previewContextSelections: input.previewContextSelections,
        ...(input.previewRowDimensionName
          ? {
              previewRowDimensionName: input.previewRowDimensionName,
            }
          : {}),
        ...(input.selectedDimensionName
          ? {
              selectedDimensionName: input.selectedDimensionName,
            }
          : {}),
        serverName: input.serverName,
      };

      updateState((currentValue) => {
        return {
          ...currentValue,
          savedViews: [savedView, ...currentValue.savedViews].slice(
            0,
            maxSavedViews,
          ),
        };
      });

      return savedView;
    },
    [updateState],
  );

  const removeSavedView = useCallback(
    (savedViewId: string): void => {
      updateState((currentValue) => {
        return {
          ...currentValue,
          savedViews: currentValue.savedViews.filter(
            (savedView) => savedView.id !== savedViewId,
          ),
        };
      });
    },
    [updateState],
  );

  return {
    addRecentCube,
    favorites: state.favorites,
    isFavorite,
    recentCubes: state.recentCubes,
    removeSavedView,
    saveView,
    savedViews: state.savedViews,
    toggleFavorite,
  };
};

const readWorkspacePersistenceState = (): WorkspacePersistenceState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  const rawState = window.localStorage.getItem(storageKey);

  if (!rawState) {
    return emptyState;
  }

  try {
    const parsedState = workspacePersistenceStateSchema.safeParse(
      JSON.parse(rawState) as unknown,
    );

    if (!parsedState.success) {
      return emptyState;
    }

    return parsedState.data;
  } catch {
    return emptyState;
  }
};

const writeWorkspacePersistenceState = (
  state: WorkspacePersistenceState,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state));
  window.dispatchEvent(new Event(storageChangeEventName));
};

const createSavedViewId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const createDefaultSavedViewName = (params: {
  cubeName: string;
  selectedDimensionName?: string | undefined;
}): string => {
  if (params.selectedDimensionName) {
    return `${params.cubeName} - ${params.selectedDimensionName}`;
  }

  return `${params.cubeName} - Workspace`;
};

export { useWorkspacePersistence };
export type { SaveViewInput, WorkspacePersistenceState };
