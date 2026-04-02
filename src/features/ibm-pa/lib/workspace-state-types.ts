type WorkspacePreviewContextSelection = {
  dimensionName: string;
  memberName: string;
};

type FavoriteCube = {
  cubeName: string;
  favoritedAt: string;
  serverName: string;
};

type RecentCube = {
  cubeName: string;
  serverName: string;
  viewedAt: string;
};

type SavedView = {
  createdAt: string;
  cubeName: string;
  id: string;
  name: string;
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
  serverName: string;
};

export type {
  FavoriteCube,
  RecentCube,
  SavedView,
  WorkspacePreviewContextSelection,
};
