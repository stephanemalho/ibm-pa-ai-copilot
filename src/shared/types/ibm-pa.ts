type IbmPaMode = "live" | "mock";

type ServerAccessibilityClassification =
  | "accessible"
  | "authenticated_but_not_authorized"
  | "server_not_reachable_by_endpoint"
  | "unexpected_upstream_error";

type AccessResourceKind = "server" | "cube" | "dimension";

type Tm1AttributeMap = Record<string, string>;

type Tm1LocalizedAttributeMap = Tm1AttributeMap[];

type Tm1HierarchyMetadata = {
  attributes?: Tm1AttributeMap | undefined;
  caption?: string | undefined;
  cardinality?: number | undefined;
  defaultMemberName?: string | undefined;
  levelNames?: string[] | undefined;
  localizedAttributes?: Tm1LocalizedAttributeMap | undefined;
  name: string;
  structure?: string | undefined;
  uniqueName?: string | undefined;
  visible?: boolean | undefined;
};

type Tm1Member = {
  attributes?: Tm1AttributeMap | undefined;
  caption?: string | undefined;
  index?: number | undefined;
  isPlaceholder?: boolean | undefined;
  level?: number | undefined;
  localizedAttributes?: Tm1LocalizedAttributeMap | undefined;
  name: string;
  ordinal?: number | undefined;
  type?: string | undefined;
  uniqueName?: string | undefined;
  weight?: number | undefined;
};

type CubeSemanticMetadata = {
  attributes?: Tm1AttributeMap | undefined;
  caption?: string | undefined;
  cubeType?: string | undefined;
  lastDataUpdate?: string | undefined;
  lastSchemaUpdate?: string | undefined;
  localizedAttributes?: Tm1LocalizedAttributeMap | undefined;
  name: string;
  serverName: string;
  uniqueName?: string | undefined;
};

type DimensionSemanticMetadata = {
  allLeavesHierarchyName?: string | undefined;
  attributes?: Tm1AttributeMap | undefined;
  caption?: string | undefined;
  dimensionName?: string | undefined;
  localizedAttributes?: Tm1LocalizedAttributeMap | undefined;
  name: string;
  uniqueName?: string | undefined;
};

type ServerAccessibilityDiagnostic = {
  kind: AccessResourceKind;
  classification: ServerAccessibilityClassification;
  message: string;
  name: string;
  reachable: boolean;
  statusCode?: number | undefined;
};

type ServerAccessibilityResponse = {
  mode: IbmPaMode;
  servers: ServerAccessibilityDiagnostic[];
};

type CubeAccessibilityDiagnostic = CubeSemanticMetadata & {
  kind: AccessResourceKind;
  classification: ServerAccessibilityClassification;
  message: string;
  reachable: boolean;
  statusCode?: number | undefined;
};

type CubeAccessibilityResponse = {
  cubes: CubeAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeSummary = CubeSemanticMetadata;

type CubesResponse = {
  cubes: CubeSummary[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimension = DimensionSemanticMetadata & {
  cubeName: string;
  hierarchy?: Tm1HierarchyMetadata | undefined;
  hierarchyName?: string | undefined;
  serverName: string;
};

type CubeSampleMemberSet = {
  cubeName: string;
  dimensionName: string;
  hierarchyName: string;
  members: Tm1Member[];
  serverName: string;
};

type CubeDataPreviewFilter = {
  dimensionName: string;
  hierarchyName?: string | undefined;
  memberName: string;
};

type CubeDataPreviewRow = {
  formattedValue?: string | null | undefined;
  memberName: string;
  uniqueName?: string | undefined;
  value: boolean | null | number | string;
};

type CubeDataPreviewRequest = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  rowDimensionHierarchyName?: string | undefined;
  rowDimensionName: string;
  rowLimit?: number | undefined;
  serverName?: string | undefined;
};

type CubeDataPreviewResponse = {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  mode: IbmPaMode;
  rowDimensionName: string;
  rows: CubeDataPreviewRow[];
  serverName: string;
};

type CubeComparatorFilter = {
  dimensionName: string;
  hierarchyName?: string | undefined;
  memberName: string;
};

type CubeComparatorRequest = {
  baseMemberName: string;
  compareMemberName: string;
  comparisonDimensionHierarchyName?: string | undefined;
  comparisonDimensionName: string;
  contextFilters: CubeComparatorFilter[];
  cubeName: string;
  rowDimensionHierarchyName?: string | undefined;
  rowDimensionName: string;
  rowLimit?: number | undefined;
  serverName?: string | undefined;
};

type CubeComparatorRow = {
  baseFormattedValue?: string | null | undefined;
  baseValue: boolean | null | number | string;
  compareFormattedValue?: string | null | undefined;
  compareValue: boolean | null | number | string;
  deltaValue: number | null;
  rowMemberName: string;
  rowUniqueName?: string | undefined;
  variancePercentage: number | null;
};

type CubeComparatorResponse = {
  baseMemberName: string;
  compareMemberName: string;
  comparisonDimensionName: string;
  contextFilters: CubeComparatorFilter[];
  cubeName: string;
  mode: IbmPaMode;
  rowDimensionName: string;
  rows: CubeComparatorRow[];
  serverName: string;
};

type DimensionAccessibilityDiagnostic = DimensionSemanticMetadata & {
  kind: AccessResourceKind;
  classification: ServerAccessibilityClassification;
  cubeName: string;
  hierarchy?: Tm1HierarchyMetadata | undefined;
  hierarchyName?: string | undefined;
  members: Tm1Member[];
  message: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number | undefined;
};

type DimensionAccessibilityResponse = {
  cubeName: string;
  dimensions: DimensionAccessibilityDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimensionStructureDiagnostic = DimensionSemanticMetadata & {
  classification: ServerAccessibilityClassification;
  cubeName: string;
  hierarchy?: Tm1HierarchyMetadata | undefined;
  hierarchyName?: string | undefined;
  kind: AccessResourceKind;
  message: string;
  reachable: boolean;
  serverName: string;
  statusCode?: number | undefined;
};

type CubeDimensionStructureResponse = {
  cubeName: string;
  dimensions: CubeDimensionStructureDiagnostic[];
  mode: IbmPaMode;
  serverName: string;
};

type DimensionDetailResponse = {
  cubeName: string;
  dimension: DimensionAccessibilityDiagnostic;
  mode: IbmPaMode;
  serverName: string;
};

type CubeDimensionsResponse = {
  cubeName: string;
  dimensions: CubeDimension[];
  members: CubeSampleMemberSet[];
  mode: IbmPaMode;
  serverName: string;
};

export type {
  AccessResourceKind,
  CubeAccessibilityDiagnostic,
  CubeAccessibilityResponse,
  CubeDataPreviewFilter,
  CubeDataPreviewRequest,
  CubeDataPreviewResponse,
  CubeDataPreviewRow,
  CubeComparatorFilter,
  CubeComparatorRequest,
  CubeComparatorResponse,
  CubeComparatorRow,
  CubeDimension,
  CubeDimensionsResponse,
  CubeDimensionStructureDiagnostic,
  CubeDimensionStructureResponse,
  CubeSampleMemberSet,
  CubeSummary,
  CubeSemanticMetadata,
  DimensionAccessibilityDiagnostic,
  DimensionAccessibilityResponse,
  DimensionDetailResponse,
  DimensionSemanticMetadata,
  CubesResponse,
  IbmPaMode,
  ServerAccessibilityClassification,
  ServerAccessibilityDiagnostic,
  ServerAccessibilityResponse,
  Tm1AttributeMap,
  Tm1HierarchyMetadata,
  Tm1LocalizedAttributeMap,
  Tm1Member,
};
