import {
  getCubeSemanticDescriptor,
  getDimensionSemanticDescriptor,
  getMemberSemanticDescriptor,
  type SemanticKind,
} from "@/features/ibm-pa/lib/semantic";
import type { WorkspacePreviewContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type BusinessFlowId =
  | "sales-analysis"
  | "forecast-analysis"
  | "budget-vs-actual"
  | "workforce-payroll-analysis";

type BusinessFlowDimensionPreference = {
  dimensionNames?: string[] | undefined;
  label: string;
  preferredMembers?: string[] | undefined;
  semanticKinds?: SemanticKind[] | undefined;
};

type BusinessFlowDefinition = {
  cubeKeywords: string[];
  description: string;
  emptyStateHelpText: string;
  fallbackHelpText: string;
  id: BusinessFlowId;
  preferredCubeNames: string[];
  recommendedContextDimensions: BusinessFlowDimensionPreference[];
  recommendedRowDimensionNames: string[];
  semanticKindFocus: SemanticKind[];
  semanticTags: string[];
  targetServerName?: string | undefined;
  title: string;
};

type BusinessFlowCubeMatch = {
  cube: CubeAccessibilityDiagnostic;
  score: number;
};

type BusinessFlowPreviewDefaults = {
  previewContextSelections: WorkspacePreviewContextSelection[];
  previewRowDimensionName?: string | undefined;
  selectedDimensionName?: string | undefined;
};

const businessFlows = [
  {
    cubeKeywords: ["sales", "revenue", "commercial", "pipeline", "customer"],
    description:
      "Start from a sales-oriented view and move quickly toward the cube, dimensions, and preview setup that support commercial analysis.",
    emptyStateHelpText:
      "No sales-oriented cube was matched automatically. Browse cubes with strong revenue, sales, customer, or commercial semantics.",
    fallbackHelpText:
      "If the preferred sales cube is unavailable, keep the sales flow context and choose the best revenue-oriented cube from the browser.",
    id: "sales-analysis",
    preferredCubeNames: ["Sales", "Ventes", "Revenue", "Commercial"],
    recommendedContextDimensions: [
      {
        dimensionNames: ["Version", "Scenario"],
        label: "Planning context",
        preferredMembers: ["Actual", "Budget", "Forecast"],
        semanticKinds: ["Version", "Scenario"],
      },
      {
        dimensionNames: ["Entity", "Company", "Business Unit"],
        label: "Entity context",
        semanticKinds: ["Entity"],
      },
    ],
    recommendedRowDimensionNames: ["Product", "Customer", "Account", "Measure"],
    semanticKindFocus: ["Product", "Measure", "Entity"],
    semanticTags: ["Sales", "Commercial", "Revenue"],
    title: "Sales Analysis",
  },
  {
    cubeKeywords: ["forecast", "outlook", "plan"],
    description:
      "Open a planning-friendly workspace focused on forecast exploration and the dimensions that usually shape forward-looking analysis.",
    emptyStateHelpText:
      "No forecast cube was matched automatically. Look for cubes with forecast, plan, or outlook semantics.",
    fallbackHelpText:
      "If the preferred forecast cube is unavailable, open the closest planning cube and keep the forecast setup guidance visible.",
    id: "forecast-analysis",
    preferredCubeNames: ["Forecast", "Plan_Forecast", "Outlook"],
    recommendedContextDimensions: [
      {
        dimensionNames: ["Version", "Scenario"],
        label: "Scenario context",
        preferredMembers: ["Forecast", "Latest Forecast", "Plan"],
        semanticKinds: ["Version", "Scenario"],
      },
      {
        dimensionNames: ["Time", "Month", "Period"],
        label: "Time context",
        semanticKinds: ["Time"],
      },
    ],
    recommendedRowDimensionNames: ["Account", "Measure", "Entity", "Product"],
    semanticKindFocus: ["Scenario", "Version", "Time", "Measure"],
    semanticTags: ["Forecast", "Planning", "Outlook"],
    title: "Forecast Analysis",
  },
  {
    cubeKeywords: ["budget", "actual", "variance", "plan"],
    description:
      "Guide users into a comparison-oriented workspace for budget versus actual analysis with planning context already suggested.",
    emptyStateHelpText:
      "No cube was matched automatically for budget versus actual analysis. Look for budget, actual, plan, or variance-oriented cubes.",
    fallbackHelpText:
      "If the preferred comparison cube is unavailable, choose the closest planning cube and keep Version or Scenario as the main comparison axis.",
    id: "budget-vs-actual",
    preferredCubeNames: ["Budget", "Actual", "Plan_Budget", "Variance"],
    recommendedContextDimensions: [
      {
        dimensionNames: ["Version", "Scenario"],
        label: "Comparison context",
        preferredMembers: ["Actual", "Budget"],
        semanticKinds: ["Version", "Scenario"],
      },
      {
        dimensionNames: ["Time", "Month", "Period"],
        label: "Period context",
        semanticKinds: ["Time"],
      },
    ],
    recommendedRowDimensionNames: ["Account", "Measure", "Entity"],
    semanticKindFocus: ["Version", "Scenario", "Time", "Measure"],
    semanticTags: ["Budget", "Actual", "Comparison"],
    title: "Budget vs Actual",
  },
  {
    cubeKeywords: ["workforce", "payroll", "salary", "headcount", "hr"],
    description:
      "Start in a workforce-friendly flow that emphasizes payroll, headcount, and organization-related exploration paths.",
    emptyStateHelpText:
      "No workforce or payroll cube was matched automatically. Look for payroll, salary, headcount, or HR-oriented cubes.",
    fallbackHelpText:
      "If the preferred workforce cube is unavailable, use the closest payroll or headcount cube and keep Entity and Time as the main guides.",
    id: "workforce-payroll-analysis",
    preferredCubeNames: ["Payroll", "Workforce", "Headcount", "Salary"],
    recommendedContextDimensions: [
      {
        dimensionNames: ["Version", "Scenario"],
        label: "Scenario context",
        preferredMembers: ["Actual", "Budget", "Forecast"],
        semanticKinds: ["Version", "Scenario"],
      },
      {
        dimensionNames: ["Entity", "Department", "Cost Center"],
        label: "Organization context",
        semanticKinds: ["Entity"],
      },
    ],
    recommendedRowDimensionNames: ["Entity", "Account", "Measure", "Time"],
    semanticKindFocus: ["Entity", "Measure", "Time"],
    semanticTags: ["Workforce", "Payroll", "Headcount"],
    title: "Workforce / Payroll Analysis",
  },
] satisfies BusinessFlowDefinition[];

const getBusinessFlows = (): BusinessFlowDefinition[] => {
  return businessFlows;
};

const getBusinessFlow = (
  flowId: string,
): BusinessFlowDefinition | undefined => {
  return businessFlows.find((flow) => flow.id === flowId);
};

const getRankedBusinessFlowCubes = (
  flow: BusinessFlowDefinition,
  cubes: CubeAccessibilityDiagnostic[],
): BusinessFlowCubeMatch[] => {
  return cubes
    .filter((cube) => cube.reachable)
    .map((cube) => {
      return {
        cube,
        score: scoreCubeForBusinessFlow(flow, cube),
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
};

const getBusinessFlowRecommendedCube = (
  flow: BusinessFlowDefinition,
  cubes: CubeAccessibilityDiagnostic[],
): CubeAccessibilityDiagnostic | null => {
  return getRankedBusinessFlowCubes(flow, cubes)[0]?.cube ?? null;
};

const scoreCubeForBusinessFlow = (
  flow: BusinessFlowDefinition,
  cube: Pick<
    CubeAccessibilityDiagnostic,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
): number => {
  const semantic = getCubeSemanticDescriptor(cube);
  const combinedValue = normalizeSearchValue([
    semantic.displayLabel,
    semantic.technicalName,
    semantic.description,
    semantic.usageHint,
    semantic.uniqueName,
  ]);
  let score = 0;

  for (const preferredCubeName of flow.preferredCubeNames) {
    const normalizedPreferredCubeName = normalizeSearchValue([preferredCubeName]);

    if (combinedValue.includes(normalizedPreferredCubeName)) {
      score += 40;
    }

    if (
      semantic.technicalName.toLowerCase() === preferredCubeName.toLowerCase() ||
      semantic.displayLabel.toLowerCase() === preferredCubeName.toLowerCase()
    ) {
      score += 80;
    }
  }

  for (const keyword of flow.cubeKeywords) {
    const normalizedKeyword = normalizeSearchValue([keyword]);

    if (combinedValue.includes(normalizedKeyword)) {
      score += 18;
    }
  }

  if (flow.semanticKindFocus.includes(semantic.semanticKind)) {
    score += 16;
  }

  if (semantic.quality === "rich") {
    score += 8;
  }

  if (semantic.semanticSource === "manual") {
    score += 8;
  }

  return score;
};

const getBusinessFlowPreviewDefaults = (
  flow: BusinessFlowDefinition,
  dimensions: DimensionAccessibilityDiagnostic[],
): BusinessFlowPreviewDefaults => {
  const previewRowDimensionName = getRecommendedRowDimensionName(flow, dimensions);
  const previewContextSelections = flow.recommendedContextDimensions.flatMap(
    (preference) => {
      const matchedDimension = getDimensionMatch(preference, dimensions, [
        previewRowDimensionName,
      ]);

      if (!matchedDimension || matchedDimension.members.length === 0) {
        return [];
      }

      const selectedMember = getPreferredMemberName(
        matchedDimension,
        preference.preferredMembers,
      );

      if (!selectedMember) {
        return [];
      }

      return [
        {
          dimensionName: matchedDimension.name,
          memberName: selectedMember,
        },
      ];
    },
  );

  return {
    previewContextSelections,
    ...(previewRowDimensionName
      ? {
          previewRowDimensionName,
          selectedDimensionName: previewRowDimensionName,
        }
      : {}),
  };
};

const getRecommendedRowDimensionName = (
  flow: BusinessFlowDefinition,
  dimensions: Array<
    Pick<
      CubeDimensionStructureDiagnostic | DimensionAccessibilityDiagnostic,
      "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
    >
  >,
): string | undefined => {
  const namedPreference: BusinessFlowDimensionPreference = {
    dimensionNames: flow.recommendedRowDimensionNames,
    label: "Recommended row dimension",
    semanticKinds: flow.semanticKindFocus,
  };

  return getDimensionMatch(namedPreference, dimensions)?.name;
};

const getDimensionMatch = <
  TDimension extends Pick<
    CubeDimensionStructureDiagnostic | DimensionAccessibilityDiagnostic,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
>(
  preference: BusinessFlowDimensionPreference,
  dimensions: TDimension[],
  excludedNames: Array<string | undefined> = [],
): TDimension | undefined => {
  const excludedNameSet = new Set(
    excludedNames
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase()),
  );

  return dimensions
    .filter((dimension) => !excludedNameSet.has(dimension.name.toLowerCase()))
    .map((dimension) => {
      return {
        dimension,
        score: scoreDimensionPreference(preference, dimension),
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.dimension;
};

const scoreDimensionPreference = (
  preference: BusinessFlowDimensionPreference,
  dimension: Pick<
    CubeDimensionStructureDiagnostic | DimensionAccessibilityDiagnostic,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
): number => {
  const semantic = getDimensionSemanticDescriptor(dimension);
  const combinedValue = normalizeSearchValue([
    semantic.displayLabel,
    semantic.technicalName,
    semantic.description,
    semantic.uniqueName,
  ]);
  let score = 0;

  for (const dimensionName of preference.dimensionNames ?? []) {
    const normalizedDimensionName = normalizeSearchValue([dimensionName]);

    if (combinedValue.includes(normalizedDimensionName)) {
      score += 36;
    }

    if (
      semantic.technicalName.toLowerCase() === dimensionName.toLowerCase() ||
      semantic.displayLabel.toLowerCase() === dimensionName.toLowerCase()
    ) {
      score += 64;
    }
  }

  if (
    preference.semanticKinds &&
    preference.semanticKinds.includes(semantic.semanticKind)
  ) {
    score += 24;
  }

  return score;
};

const getPreferredMemberName = (
  dimension: Pick<DimensionAccessibilityDiagnostic, "members">,
  preferredMembers?: string[] | undefined,
): string | undefined => {
  if (preferredMembers) {
    for (const preferredMember of preferredMembers) {
      const matchingMember = dimension.members.find((member) => {
        const semantic = getMemberSemanticDescriptor(member);

        return (
          semantic.technicalName.toLowerCase() === preferredMember.toLowerCase() ||
          semantic.displayLabel.toLowerCase() === preferredMember.toLowerCase()
        );
      });

      if (matchingMember) {
        return matchingMember.name;
      }
    }
  }

  return dimension.members[0]?.name;
};

const normalizeSearchValue = (values: string[]): string => {
  return values.join(" ").toLowerCase();
};

export {
  businessFlows,
  getBusinessFlow,
  getBusinessFlowPreviewDefaults,
  getBusinessFlowRecommendedCube,
  getBusinessFlows,
  getRankedBusinessFlowCubes,
  getRecommendedRowDimensionName,
  scoreCubeForBusinessFlow,
};
export type {
  BusinessFlowDefinition,
  BusinessFlowDimensionPreference,
  BusinessFlowId,
  BusinessFlowPreviewDefaults,
};
