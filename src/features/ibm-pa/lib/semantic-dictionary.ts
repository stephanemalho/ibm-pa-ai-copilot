import type { SemanticKind } from "@/features/ibm-pa/lib/semantic";

type ManualSemanticOverride = {
  businessLabel?: string | undefined;
  description?: string | undefined;
  semanticKind?: SemanticKind | undefined;
  usageHint?: string | undefined;
};

type ManualSemanticDictionary = {
  cubes: Record<string, ManualSemanticOverride>;
  dimensions: Record<string, ManualSemanticOverride>;
};

const manualSemanticDictionary: ManualSemanticDictionary = {
  cubes: {
    Plan_Budget: {
      businessLabel: "Budget Plan",
      description:
        "Budget planning cube used to review target values across planning axes.",
      semanticKind: "Scenario",
      usageHint:
        "Use this cube when comparing budget assumptions by version, account, and time.",
    },
    Plan_Forecast: {
      businessLabel: "Forecast Plan",
      description:
        "Forecast planning cube used to inspect updated outlook values.",
      semanticKind: "Scenario",
      usageHint:
        "Use this cube to review the latest rolling forecast against the planning structure.",
    },
  },
  dimensions: {
    Version: {
      businessLabel: "Plan Version",
      description: "Planning versions such as Actual, Budget, and Forecast.",
      semanticKind: "Version",
      usageHint:
        "Use this dimension to compare actuals and planning scenarios.",
    },
    Month: {
      businessLabel: "Month",
      description: "Monthly time buckets used in planning and reporting.",
      semanticKind: "Time",
      usageHint:
        "Use this dimension to navigate periods and reporting cadence.",
    },
    Account: {
      businessLabel: "Account",
      description: "Measures and financial account lines used in analysis.",
      semanticKind: "Measure",
      usageHint:
        "Use this dimension to select the financial metric to analyze.",
    },
    Currency: {
      businessLabel: "Currency",
      semanticKind: "Currency",
      usageHint: "Use this dimension when comparing values across currencies.",
    },
    Entity: {
      businessLabel: "Entity",
      semanticKind: "Entity",
      usageHint:
        "Use this dimension to scope the analysis to a legal entity or business unit.",
    },
  },
};

const getManualSemanticOverride = (
  entityType: keyof ManualSemanticDictionary,
  technicalName: string,
): ManualSemanticOverride | undefined => {
  return manualSemanticDictionary[entityType][technicalName];
};

export { getManualSemanticOverride, manualSemanticDictionary };
export type { ManualSemanticDictionary, ManualSemanticOverride };
