import {
  getCubeSemanticDescriptor,
  getDimensionSemanticDescriptor,
} from "@/features/ibm-pa/lib/semantic";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
  ServerAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type DiagnosticTone = "critical" | "good" | "neutral" | "warning";

type DiagnosticStatus = {
  detail: string;
  label: string;
  tone: DiagnosticTone;
};

type ServerDiagnosticsSummary = {
  accessStatus: DiagnosticStatus;
  accessibleCubeCount: number;
  limitedCubeCount: number;
  semanticCoverageStatus: DiagnosticStatus;
  summaryMessage: string;
  usabilityStatus: DiagnosticStatus;
  visibleCubeCount: number;
};

type CubeDiagnosticsSummary = {
  accessStatus: DiagnosticStatus;
  comparisonReadinessStatus: DiagnosticStatus;
  dimensionAccessStatus: DiagnosticStatus;
  manualEnrichmentStatus: DiagnosticStatus;
  metadataRichnessStatus: DiagnosticStatus;
  previewReadinessStatus: DiagnosticStatus;
  semanticQualityStatus: DiagnosticStatus;
  summaryMessage: string;
  updateMetadataStatus: DiagnosticStatus;
};

type DimensionDiagnosticsSummary = {
  accessStatus: DiagnosticStatus;
  comparisonReadinessStatus: DiagnosticStatus;
  hierarchyMetadataStatus: DiagnosticStatus;
  manualEnrichmentStatus: DiagnosticStatus;
  memberPreviewStatus: DiagnosticStatus;
  previewReadinessStatus: DiagnosticStatus;
  semanticQualityStatus: DiagnosticStatus;
  summaryMessage: string;
};

const deriveServerDiagnostics = (
  server: ServerAccessibilityDiagnostic,
  cubes: CubeAccessibilityDiagnostic[],
): ServerDiagnosticsSummary => {
  const accessibleCubeCount = cubes.filter((cube) => cube.reachable).length;
  const limitedCubeCount = cubes.filter((cube) => {
    const semantic = getCubeSemanticDescriptor(cube);

    return !cube.reachable || semantic.quality === "recommended";
  }).length;
  const semanticRecommendedCount = cubes.filter((cube) => {
    return getCubeSemanticDescriptor(cube).quality === "recommended";
  }).length;
  const accessStatus = server.reachable
    ? createStatus(
        "Reachable",
        "Existing IBM session flow can inspect this TM1 server.",
        "good",
      )
    : createStatus(
        "Visible only",
        "The server is discoverable but not currently usable for exploration.",
        "critical",
      );
  const usabilityStatus = !server.reachable
    ? createStatus(
        "Unavailable",
        "Cube exploration is blocked until server access is restored.",
        "critical",
      )
    : accessibleCubeCount === 0
      ? createStatus(
          "Limited",
          "The server responds, but no cubes are currently exploitable.",
          "warning",
        )
      : limitedCubeCount > 0
        ? createStatus(
            "Review recommended",
            "Some cubes are visible but limited by access or semantic quality.",
            "warning",
          )
        : createStatus(
            "Healthy",
            "Visible cubes look ready for consultant and business exploration.",
            "good",
          );
  const semanticCoverageStatus =
    cubes.length === 0
      ? createStatus(
          "Unknown",
          "No cubes were returned, so semantic coverage cannot be evaluated yet.",
          "neutral",
        )
      : semanticRecommendedCount === 0
        ? createStatus(
            "Strong coverage",
            "Cubes expose enough semantic information for a business-friendly explorer.",
            "good",
          )
        : semanticRecommendedCount < Math.ceil(cubes.length / 2)
          ? createStatus(
              "Partial coverage",
              "Some cubes still rely on fallback naming or missing descriptions.",
              "warning",
            )
          : createStatus(
              "Manual enrichment recommended",
              "Semantic coverage is weak enough to hurt exploration quality.",
              "warning",
            );

  return {
    accessStatus,
    accessibleCubeCount,
    limitedCubeCount,
    semanticCoverageStatus,
    summaryMessage: buildServerSummaryMessage({
      accessibleCubeCount,
      limitedCubeCount,
      server,
      visibleCubeCount: cubes.length,
    }),
    usabilityStatus,
    visibleCubeCount: cubes.length,
  };
};

const deriveCubeDiagnostics = (params: {
  cube: CubeAccessibilityDiagnostic;
  dimensions?: CubeDimensionStructureDiagnostic[] | undefined;
  selectedDimension?: DimensionAccessibilityDiagnostic | null | undefined;
}): CubeDiagnosticsSummary => {
  const semantic = getCubeSemanticDescriptor(params.cube);
  const accessibleDimensions = (params.dimensions ?? []).filter((dimension) => {
    return dimension.reachable;
  });
  const previewReadinessStatus = !params.cube.reachable
    ? createStatus(
        "Unavailable",
        "The cube is visible but cannot open its workspace.",
        "critical",
      )
    : accessibleDimensions.length === 0
      ? createStatus(
          "Not enough data",
          "No accessible dimensions were returned for guided preview.",
          "warning",
        )
      : createStatus(
          "Ready",
          "At least one accessible dimension is available for read-only preview.",
          "good",
        );
  const comparisonReadinessStatus = !params.cube.reachable
    ? createStatus(
        "Unavailable",
        "Comparison is blocked because the cube workspace cannot be opened.",
        "critical",
      )
    : accessibleDimensions.length < 2
      ? createStatus(
          "Limited",
          "Comparison usually needs at least two accessible dimensions to stay meaningful.",
          "warning",
        )
      : createStatus(
          "Ready",
          "The cube exposes enough structural dimensions for guided A/B comparisons.",
          "good",
        );
  const metadataRichnessSignals = [
    Boolean(params.cube.caption),
    Boolean(params.cube.uniqueName),
    Boolean(params.cube.lastSchemaUpdate),
    Boolean(params.cube.lastDataUpdate),
    Boolean(params.cube.attributes && Object.keys(params.cube.attributes).length > 0),
  ].filter(Boolean).length;
  const metadataRichnessStatus =
    metadataRichnessSignals >= 4
      ? createStatus(
          "Rich metadata",
          "Captions, unique names, and update timestamps are broadly available.",
          "good",
        )
      : metadataRichnessSignals >= 2
        ? createStatus(
            "Partial metadata",
            "Enough metadata is available to explore, but some fields are still missing.",
            "warning",
          )
        : createStatus(
            "Weak metadata",
            "This cube relies heavily on technical metadata fallbacks.",
            "warning",
          );
  const updateMetadataStatus =
    params.cube.lastSchemaUpdate && params.cube.lastDataUpdate
      ? createStatus(
          "Schema + data timestamps",
          "Both schema and data update markers are available for diagnostics.",
          "good",
        )
      : params.cube.lastSchemaUpdate || params.cube.lastDataUpdate
        ? createStatus(
            "Partial timestamps",
            "Only one update marker is currently exposed by TM1.",
            "warning",
          )
        : createStatus(
            "No timestamps",
            "Schema and data update metadata are not available for this cube.",
            "neutral",
          );
  const semanticQualityStatus = mapSemanticQualityStatus(semantic.qualityLabel, semantic.quality);
  const dimensionAccessStatus =
    params.dimensions === undefined
      ? createStatus(
          "Unknown",
          "Dimension diagnostics have not been loaded for this cube yet.",
          "neutral",
        )
      : accessibleDimensions.length === 0
        ? createStatus(
            "No accessible dimensions",
            "Visible cube, but no dimensions are currently exploitable.",
            "critical",
          )
        : accessibleDimensions.length < params.dimensions.length
          ? createStatus(
              "Partial dimension access",
              "Some dimensions remain visible but not fully usable.",
              "warning",
            )
          : createStatus(
              "Dimensions accessible",
              "The full ordered structure is available for workspace inspection.",
              "good",
            );
  const manualEnrichmentStatus =
    semantic.quality === "recommended"
      ? createStatus(
          "Recommended",
          "Manual business naming would noticeably improve cube usability.",
          "warning",
        )
      : semantic.quality === "partial"
        ? createStatus(
            "Optional",
            "Manual enrichment could sharpen the business presentation further.",
            "neutral",
          )
        : createStatus(
            "Not needed now",
            "Current semantic enrichment already looks strong enough.",
            "good",
          );

  return {
    accessStatus: params.cube.reachable
      ? createStatus(
          "Accessible",
          "The cube can be opened in the dedicated workspace.",
          "good",
        )
      : createStatus(
          "Visible only",
          "The cube is listed but not currently exploitable in the workspace.",
          "critical",
        ),
    comparisonReadinessStatus,
    dimensionAccessStatus,
    manualEnrichmentStatus,
    metadataRichnessStatus,
    previewReadinessStatus,
    semanticQualityStatus,
    summaryMessage: buildCubeSummaryMessage({
      accessibleDimensionCount: accessibleDimensions.length,
      cube: params.cube,
      selectedDimension: params.selectedDimension ?? null,
    }),
    updateMetadataStatus,
  };
};

const deriveDimensionDiagnostics = (
  dimension: DimensionAccessibilityDiagnostic,
): DimensionDiagnosticsSummary => {
  const semantic = getDimensionSemanticDescriptor(dimension);
  const hierarchySignals = [
    Boolean(dimension.hierarchy?.caption),
    Boolean(dimension.hierarchy?.cardinality !== undefined),
    Boolean(dimension.hierarchy?.structure),
    Boolean(dimension.hierarchy?.uniqueName),
    Boolean(dimension.hierarchy?.visible !== undefined),
    Boolean(dimension.hierarchy?.levelNames?.length),
  ].filter(Boolean).length;
  const hierarchyMetadataStatus =
    hierarchySignals >= 4
      ? createStatus(
          "Rich hierarchy metadata",
          "Caption, unique name, structure, and hierarchy properties are available.",
          "good",
        )
      : hierarchySignals >= 2
        ? createStatus(
            "Partial hierarchy metadata",
            "Some hierarchy metadata is available, but consultant diagnostics stay incomplete.",
            "warning",
          )
        : createStatus(
            "Weak hierarchy metadata",
            "Hierarchy-level metadata is sparse or missing.",
            "warning",
          );
  const memberPreviewStatus =
    dimension.members.length >= 8
      ? createStatus(
          "Rich member preview",
          "Enough sample members are available to qualify the dimension quickly.",
          "good",
        )
      : dimension.members.length >= 2
        ? createStatus(
            "Partial member preview",
            "Only a small sample of members is available for inspection.",
            "warning",
          )
        : dimension.members.length === 1
          ? createStatus(
              "Thin member preview",
              "Only one member was returned, limiting diagnostics and comparison setup.",
              "warning",
            )
          : createStatus(
              "No member preview",
              "No members were returned for this dimension.",
              "critical",
            );
  const previewReadinessStatus = !dimension.reachable
    ? createStatus(
        "Unavailable",
        "Dimension detail cannot be opened with the current access.",
        "critical",
      )
    : dimension.members.length > 0
      ? createStatus(
          "Ready",
          "Member samples are available for preview context selection.",
          "good",
        )
      : createStatus(
          "Limited",
          "The dimension is reachable, but no members are available for preview context.",
          "warning",
        );
  const comparisonReadinessStatus = !dimension.reachable
    ? createStatus(
        "Unavailable",
        "Comparison support is blocked because the dimension cannot be loaded.",
        "critical",
      )
    : dimension.members.length >= 2
      ? createStatus(
          "Ready",
          "At least two members are available for comparison choices or qualification.",
          "good",
        )
      : createStatus(
          "Limited",
          "More member richness is needed for reliable comparison setup.",
          "warning",
        );
  const manualEnrichmentStatus =
    semantic.quality === "recommended"
      ? createStatus(
          "Recommended",
          "This dimension still depends heavily on fallback naming and generic descriptions.",
          "warning",
        )
      : semantic.quality === "partial"
        ? createStatus(
            "Optional",
            "Additional captions or business hints would improve consultant readability.",
            "neutral",
          )
        : createStatus(
            "Not needed now",
            "Semantic enrichment already looks strong enough for diagnostics.",
            "good",
          );

  return {
    accessStatus: dimension.reachable
      ? createStatus(
          "Accessible",
          "Dimension detail and sample members can be inspected.",
          "good",
        )
      : createStatus(
          "Visible only",
          "The dimension is listed but not fully exploitable.",
          "critical",
        ),
    comparisonReadinessStatus,
    hierarchyMetadataStatus,
    manualEnrichmentStatus,
    memberPreviewStatus,
    previewReadinessStatus,
    semanticQualityStatus: mapSemanticQualityStatus(
      semantic.qualityLabel,
      semantic.quality,
    ),
    summaryMessage: buildDimensionSummaryMessage({
      dimension,
      semanticQuality: semantic.quality,
    }),
  };
};

const createStatus = (
  label: string,
  detail: string,
  tone: DiagnosticTone,
): DiagnosticStatus => {
  return {
    detail,
    label,
    tone,
  };
};

const mapSemanticQualityStatus = (
  label: string,
  quality: "partial" | "recommended" | "rich",
): DiagnosticStatus => {
  switch (quality) {
    case "rich":
      return createStatus(
        label,
        "TM1 metadata and semantic enrichment combine into a strong business-facing label set.",
        "good",
      );
    case "partial":
      return createStatus(
        label,
        "The explorer remains usable, but some naming or guidance still relies on fallbacks.",
        "warning",
      );
    case "recommended":
      return createStatus(
        label,
        "Manual enrichment would materially improve diagnostics and business readability.",
        "warning",
      );
  }
};

const buildServerSummaryMessage = (params: {
  accessibleCubeCount: number;
  limitedCubeCount: number;
  server: ServerAccessibilityDiagnostic;
  visibleCubeCount: number;
}): string => {
  if (!params.server.reachable) {
    return `${params.server.name} is visible to discovery, but not currently usable for consultant diagnostics or business exploration.`;
  }

  if (params.visibleCubeCount === 0) {
    return `${params.server.name} responded successfully, but no cubes were returned for this account.`;
  }

  if (params.limitedCubeCount > 0) {
    return `${params.server.name} exposes ${params.visibleCubeCount} visible cubes, with ${params.limitedCubeCount} resources that still need access or enrichment review.`;
  }

  return `${params.server.name} exposes ${params.accessibleCubeCount} accessible cubes with a healthy exploration baseline.`;
};

const buildCubeSummaryMessage = (params: {
  accessibleDimensionCount: number;
  cube: CubeAccessibilityDiagnostic;
  selectedDimension: DimensionAccessibilityDiagnostic | null;
}): string => {
  if (!params.cube.reachable) {
    return `${params.cube.name} is visible in the catalog, but not exploitable in the current workspace.`;
  }

  if (params.accessibleDimensionCount === 0) {
    return `${params.cube.name} opens, but no accessible dimensions were returned for guided exploration.`;
  }

  if (params.selectedDimension && !params.selectedDimension.reachable) {
    return `${params.cube.name} is accessible, but the currently selected dimension remains limited by access.`;
  }

  return `${params.cube.name} is accessible with ${params.accessibleDimensionCount} dimensions currently available for consultant and business workflows.`;
};

const buildDimensionSummaryMessage = (params: {
  dimension: DimensionAccessibilityDiagnostic;
  semanticQuality: "partial" | "recommended" | "rich";
}): string => {
  if (!params.dimension.reachable) {
    return `${params.dimension.name} remains visible in the structure, but detailed metadata is not exploitable for this account.`;
  }

  if (params.dimension.members.length === 0) {
    return `${params.dimension.name} is accessible, but no members were returned to validate preview or comparison readiness.`;
  }

  if (params.semanticQuality === "recommended") {
    return `${params.dimension.name} is explorable, but semantic enrichment is still weak enough to justify manual review.`;
  }

  return `${params.dimension.name} is accessible with usable hierarchy and member diagnostics for the current workspace.`;
};

export {
  deriveCubeDiagnostics,
  deriveDimensionDiagnostics,
  deriveServerDiagnostics,
  type CubeDiagnosticsSummary,
  type DiagnosticStatus,
  type DiagnosticTone,
  type DimensionDiagnosticsSummary,
  type ServerDiagnosticsSummary,
};
