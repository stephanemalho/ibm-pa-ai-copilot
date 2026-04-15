"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComparatorQueryBuilder } from "@/features/ibm-pa/components/comparator-query-builder";
import { ComparatorResultTable } from "@/features/ibm-pa/components/comparator-result-table";
import {
  cubeComparatorResponseSchema,
  dimensionAccessibilityResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import { getDimensionSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import type { WorkspaceComparatorContextSelection } from "@/features/ibm-pa/lib/workspace-state-types";
import { appRoutes } from "@/shared/lib/routes";
import type {
  CubeComparatorResponse,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type ComparatorPanelProps = {
  cubeName: string;
  initialBaseMemberName?: string | undefined;
  initialCompareMemberName?: string | undefined;
  initialComparisonDimensionName?: string | undefined;
  initialContextSelections?: WorkspaceComparatorContextSelection[] | undefined;
  initialRowDimensionName?: string | undefined;
  onStateChange?:
    | ((value: {
        comparatorBaseMemberName?: string | undefined;
        comparatorCompareMemberName?: string | undefined;
        comparatorComparisonDimensionName?: string | undefined;
        comparatorContextSelections: WorkspaceComparatorContextSelection[];
        comparatorRowDimensionName?: string | undefined;
      }) => void)
    | undefined;
  selectedDimensionName?: string | null | undefined;
  serverName: string;
};

type ComparatorDimensionsState =
  | {
      status: "loading";
    }
  | {
      message: string;
      status: "error";
    }
  | {
      dimensions: DimensionAccessibilityDiagnostic[];
      status: "success";
    };

type ComparatorResultState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      data: CubeComparatorResponse;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

type ContextSelectionMap = Record<string, string>;

const dimensionSampleSize = 12;

const ComparatorPanel = ({
  cubeName,
  initialBaseMemberName,
  initialCompareMemberName,
  initialComparisonDimensionName,
  initialContextSelections,
  initialRowDimensionName,
  onStateChange,
  selectedDimensionName,
  serverName,
}: ComparatorPanelProps): ReactNode => {
  const [dimensionsState, setDimensionsState] =
    useState<ComparatorDimensionsState>({
      status: "loading",
    });
  const [rowDimensionName, setRowDimensionName] = useState<string | null>(
    initialRowDimensionName ?? null,
  );
  const [comparisonDimensionName, setComparisonDimensionName] = useState<
    string | null
  >(initialComparisonDimensionName ?? null);
  const [baseMemberName, setBaseMemberName] = useState(
    initialBaseMemberName ?? "",
  );
  const [compareMemberName, setCompareMemberName] = useState(
    initialCompareMemberName ?? "",
  );
  const [contextSelections, setContextSelections] =
    useState<ContextSelectionMap>(() => {
      return Object.fromEntries(
        (initialContextSelections ?? []).map((selection) => {
          return [selection.dimensionName, selection.memberName];
        }),
      );
    });
  const [resultState, setResultState] = useState<ComparatorResultState>({
    status: "idle",
  });
  const accessibleDimensions = useMemo(() => {
    return dimensionsState.status === "success"
      ? dimensionsState.dimensions.filter((dimension) => dimension.reachable)
      : [];
  }, [dimensionsState]);

  useEffect(() => {
    let isActive = true;

    const loadComparatorDimensions = async (): Promise<void> => {
      try {
        const response = await fetch(
          `${appRoutes.ibmDimensionAccess}?cube=${encodeURIComponent(cubeName)}&server=${encodeURIComponent(serverName)}&sampleSize=${dimensionSampleSize}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          const parsedError = routeErrorSchema.safeParse(payload);

          if (!isActive) {
            return;
          }

          setDimensionsState({
            message: parsedError.success
              ? parsedError.data.error.message
              : "Unable to load comparison dimensions.",
            status: "error",
          });
          return;
        }

        const parsedPayload =
          dimensionAccessibilityResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setDimensionsState({
          dimensions: parsedPayload.dimensions,
          status: "success",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDimensionsState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to load comparison dimensions.",
          status: "error",
        });
      }
    };

    void loadComparatorDimensions();

    return () => {
      isActive = false;
    };
  }, [cubeName, serverName]);

  const effectiveRowDimensionName = useMemo(() => {
    if (
      rowDimensionName &&
      accessibleDimensions.some(
        (dimension) => dimension.name === rowDimensionName,
      )
    ) {
      return rowDimensionName;
    }

    if (
      selectedDimensionName &&
      accessibleDimensions.some(
        (dimension) => dimension.name === selectedDimensionName,
      )
    ) {
      return selectedDimensionName;
    }

    return accessibleDimensions[0]?.name ?? null;
  }, [accessibleDimensions, rowDimensionName, selectedDimensionName]);
  const selectableComparisonDimensions = useMemo(() => {
    return accessibleDimensions.filter((dimension) => {
      return (
        dimension.name !== effectiveRowDimensionName &&
        dimension.members.length >= 2
      );
    });
  }, [accessibleDimensions, effectiveRowDimensionName]);
  const effectiveComparisonDimensionName = useMemo(() => {
    if (
      comparisonDimensionName &&
      selectableComparisonDimensions.some(
        (dimension) => dimension.name === comparisonDimensionName,
      )
    ) {
      return comparisonDimensionName;
    }

    return getDefaultComparisonDimensionName(
      selectableComparisonDimensions,
      effectiveRowDimensionName,
    );
  }, [
    comparisonDimensionName,
    effectiveRowDimensionName,
    selectableComparisonDimensions,
  ]);
  const comparisonDimension = useMemo(() => {
    if (!effectiveComparisonDimensionName) {
      return null;
    }

    return (
      accessibleDimensions.find(
        (dimension) => dimension.name === effectiveComparisonDimensionName,
      ) ?? null
    );
  }, [accessibleDimensions, effectiveComparisonDimensionName]);
  const comparisonMemberDefaults = useMemo(() => {
    return getDefaultComparisonMembers(comparisonDimension);
  }, [comparisonDimension]);
  const effectiveBaseMemberName = useMemo(() => {
    if (
      baseMemberName &&
      comparisonDimension?.members.some(
        (member) => member.name === baseMemberName,
      )
    ) {
      return baseMemberName;
    }

    return comparisonMemberDefaults.baseMemberName;
  }, [
    baseMemberName,
    comparisonDimension,
    comparisonMemberDefaults.baseMemberName,
  ]);
  const effectiveCompareMemberName = useMemo(() => {
    if (
      compareMemberName &&
      compareMemberName !== effectiveBaseMemberName &&
      comparisonDimension?.members.some(
        (member) => member.name === compareMemberName,
      )
    ) {
      return compareMemberName;
    }

    return comparisonMemberDefaults.compareMemberName;
  }, [
    compareMemberName,
    comparisonDimension,
    comparisonMemberDefaults.compareMemberName,
    effectiveBaseMemberName,
  ]);
  const contextDimensions = useMemo(() => {
    return accessibleDimensions.filter((dimension) => {
      return (
        dimension.name !== effectiveRowDimensionName &&
        dimension.name !== effectiveComparisonDimensionName &&
        dimension.members.length > 0
      );
    });
  }, [
    accessibleDimensions,
    effectiveComparisonDimensionName,
    effectiveRowDimensionName,
  ]);
  const effectiveContextSelections = useMemo(() => {
    return contextDimensions.flatMap((dimension) => {
      const selectedMemberName =
        contextSelections[dimension.name] ?? dimension.members[0]?.name;

      if (!selectedMemberName) {
        return [];
      }

      return [
        {
          dimensionName: dimension.name,
          memberName: selectedMemberName,
        },
      ];
    });
  }, [contextDimensions, contextSelections]);
  const comparatorReadyState = useMemo(() => {
    if (accessibleDimensions.length === 0) {
      return {
        description:
          "No accessible dimensions are available yet for a guided comparison.",
        title: "Comparator unavailable",
      };
    }

    if (!effectiveRowDimensionName) {
      return {
        description:
          "Choose a row dimension to structure the comparison output.",
        title: "Row dimension required",
      };
    }

    if (!comparisonDimension) {
      return {
        description:
          "Choose a comparison dimension with at least two sample members.",
        title: "Comparison dimension required",
      };
    }

    if (!effectiveBaseMemberName || !effectiveCompareMemberName) {
      return {
        description: "Choose two members to compare before running the query.",
        title: "Comparison members required",
      };
    }

    if (effectiveBaseMemberName === effectiveCompareMemberName) {
      return {
        description: "Pick two different members for A versus B comparison.",
        title: "Two distinct members required",
      };
    }

    return null;
  }, [
    accessibleDimensions.length,
    comparisonDimension,
    effectiveBaseMemberName,
    effectiveCompareMemberName,
    effectiveRowDimensionName,
  ]);

  useEffect(() => {
    onStateChange?.({
      ...(effectiveBaseMemberName
        ? {
            comparatorBaseMemberName: effectiveBaseMemberName,
          }
        : {}),
      ...(effectiveCompareMemberName
        ? {
            comparatorCompareMemberName: effectiveCompareMemberName,
          }
        : {}),
      ...(effectiveComparisonDimensionName
        ? {
            comparatorComparisonDimensionName: effectiveComparisonDimensionName,
          }
        : {}),
      comparatorContextSelections: effectiveContextSelections,
      ...(effectiveRowDimensionName
        ? {
            comparatorRowDimensionName: effectiveRowDimensionName,
          }
        : {}),
    });
  }, [
    effectiveBaseMemberName,
    effectiveCompareMemberName,
    effectiveComparisonDimensionName,
    effectiveContextSelections,
    effectiveRowDimensionName,
    onStateChange,
  ]);

  const handleCompare = async (): Promise<void> => {
    if (
      !comparisonDimension ||
      !effectiveRowDimensionName ||
      !effectiveBaseMemberName ||
      !effectiveCompareMemberName ||
      effectiveBaseMemberName === effectiveCompareMemberName
    ) {
      return;
    }

    const selectedRowDimension = accessibleDimensions.find(
      (dimension) => dimension.name === effectiveRowDimensionName,
    );

    if (!selectedRowDimension) {
      return;
    }

    setResultState({
      status: "loading",
    });

    try {
      const response = await fetch(appRoutes.ibmComparator, {
        body: JSON.stringify({
          baseMemberName: effectiveBaseMemberName,
          compareMemberName: effectiveCompareMemberName,
          ...(comparisonDimension.hierarchyName
            ? {
                comparisonDimensionHierarchyName:
                  comparisonDimension.hierarchyName,
              }
            : {}),
          comparisonDimensionName: comparisonDimension.name,
          contextFilters: effectiveContextSelections.map((selection) => {
            const matchingDimension = contextDimensions.find(
              (dimension) => dimension.name === selection.dimensionName,
            );

            return {
              dimensionName: selection.dimensionName,
              ...(matchingDimension?.hierarchyName
                ? {
                    hierarchyName: matchingDimension.hierarchyName,
                  }
                : {}),
              memberName: selection.memberName,
            };
          }),
          cubeName,
          ...(selectedRowDimension.hierarchyName
            ? {
                rowDimensionHierarchyName: selectedRowDimension.hierarchyName,
              }
            : {}),
          rowDimensionName: effectiveRowDimensionName,
          rowLimit: 12,
          serverName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const parsedError = routeErrorSchema.safeParse(payload);

        setResultState({
          message: parsedError.success
            ? parsedError.data.error.message
            : "Unable to run the comparison.",
          status: "error",
        });
        return;
      }

      const parsedPayload = cubeComparatorResponseSchema.parse(payload);

      setResultState({
        data: parsedPayload,
        status: "success",
      });
    } catch (error) {
      setResultState({
        message:
          error instanceof Error
            ? error.message
            : "Unable to run the comparison.",
        status: "error",
      });
    }
  };

  return (
    <Card className="border-slate-200/80 bg-white/90">
      <CardHeader>
        <CardTitle className="text-xl">Comparator</CardTitle>
        <CardDescription>
          Compare two business contexts side by side using the same guided,
          read-only exploration model as Xplorer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {dimensionsState.status === "loading" ? (
          <LoadingState />
        ) : dimensionsState.status === "error" ? (
          <ErrorState
            description={dimensionsState.message}
            title="Comparator unavailable"
          />
        ) : comparatorReadyState ? (
          <EmptyState
            description={comparatorReadyState.description}
            title={comparatorReadyState.title}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <SummaryChip
                label="Comparable dimensions"
                value={selectableComparisonDimensions.length.toString()}
              />
              <SummaryChip
                label="Fixed context selectors"
                value={contextDimensions.length.toString()}
              />
              {comparisonDimension ? (
                <SummaryChip
                  label="Focus hint"
                  value={
                    getDimensionSemanticDescriptor(comparisonDimension)
                      .semanticKind === "Unknown"
                      ? "General"
                      : getDimensionSemanticDescriptor(comparisonDimension)
                          .semanticKind
                  }
                />
              ) : null}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="space-y-4">
                <ComparatorQueryBuilder
                  canRunComparison={comparatorReadyState === null}
                  comparisonDimension={comparisonDimension}
                  comparisonDimensionName={effectiveComparisonDimensionName}
                  contextDimensions={contextDimensions}
                  contextSelections={contextSelections}
                  isLoading={resultState.status === "loading"}
                  onBaseMemberChange={(memberName) => {
                    setBaseMemberName(memberName);
                    if (memberName === effectiveCompareMemberName) {
                      const fallbackCompareMemberName =
                        comparisonDimension?.members.find(
                          (member) => member.name !== memberName,
                        )?.name ?? "";

                      setCompareMemberName(fallbackCompareMemberName);
                    }
                    setResultState({
                      status: "idle",
                    });
                  }}
                  onCompare={() => {
                    void handleCompare();
                  }}
                  onCompareMemberChange={(memberName) => {
                    setCompareMemberName(memberName);
                    if (memberName === effectiveBaseMemberName) {
                      const fallbackBaseMemberName =
                        comparisonDimension?.members.find(
                          (member) => member.name !== memberName,
                        )?.name ?? "";

                      setBaseMemberName(fallbackBaseMemberName);
                    }
                    setResultState({
                      status: "idle",
                    });
                  }}
                  onComparisonDimensionChange={(dimensionName) => {
                    setComparisonDimensionName(dimensionName);
                    setBaseMemberName("");
                    setCompareMemberName("");
                    setResultState({
                      status: "idle",
                    });
                  }}
                  onContextSelectionChange={(dimensionName, memberName) => {
                    setContextSelections((currentValue) => {
                      return {
                        ...currentValue,
                        [dimensionName]: memberName,
                      };
                    });
                    setResultState({
                      status: "idle",
                    });
                  }}
                  onRowDimensionChange={(dimensionName) => {
                    setRowDimensionName(dimensionName);
                    if (dimensionName === effectiveComparisonDimensionName) {
                      setComparisonDimensionName("");
                      setBaseMemberName("");
                      setCompareMemberName("");
                    }
                    setResultState({
                      status: "idle",
                    });
                  }}
                  onSwapMembers={() => {
                    setBaseMemberName(effectiveCompareMemberName);
                    setCompareMemberName(effectiveBaseMemberName);
                    setResultState({
                      status: "idle",
                    });
                  }}
                  rowDimensionName={effectiveRowDimensionName}
                  selectedBaseMemberName={effectiveBaseMemberName}
                  selectedCompareMemberName={effectiveCompareMemberName}
                  selectableComparisonDimensions={
                    selectableComparisonDimensions
                  }
                  selectableRowDimensions={accessibleDimensions}
                />

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-900">
                    Comparison guidance
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use rows for the business list people will review line by
                    line, then compare two members from one meaningful dimension
                    while the remaining dimensions stay fixed.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Comparison result
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Review base value, compare value, absolute delta, and
                    variance percentage in one compact read-only table.
                  </p>
                </div>

                {renderComparatorResult(resultState)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const renderComparatorResult = (
  resultState: ComparatorResultState,
): ReactNode => {
  if (resultState.status === "idle") {
    return (
      <EmptyState
        description="Choose two members to compare, keep the other dimensions fixed, then run a comparison."
        title="No comparison yet"
      />
    );
  }

  if (resultState.status === "loading") {
    return <LoadingState />;
  }

  if (resultState.status === "error") {
    return (
      <ErrorState description={resultState.message} title="Comparison failed" />
    );
  }

  return <ComparatorResultTable result={resultState.data} />;
};

const getDefaultComparisonDimensionName = (
  dimensions: DimensionAccessibilityDiagnostic[],
  rowDimensionName: string | null,
): string | null => {
  const rankedDimensions = [...dimensions].sort((left, right) => {
    return (
      getComparisonDimensionPriority(left, rowDimensionName) -
      getComparisonDimensionPriority(right, rowDimensionName)
    );
  });

  return rankedDimensions[0]?.name ?? null;
};

const getComparisonDimensionPriority = (
  dimension: DimensionAccessibilityDiagnostic,
  rowDimensionName: string | null,
): number => {
  if (dimension.name === rowDimensionName) {
    return Number.MAX_SAFE_INTEGER;
  }

  const semantic = getDimensionSemanticDescriptor(dimension);

  switch (semantic.semanticKind) {
    case "Time":
      return 0;
    case "Version":
      return 1;
    case "Scenario":
      return 2;
    case "Entity":
      return 3;
    case "Product":
      return 4;
    case "Currency":
      return 5;
    case "Measure":
      return 6;
    default:
      return 7;
  }
};

const getDefaultComparisonMembers = (
  dimension: DimensionAccessibilityDiagnostic | null,
): {
  baseMemberName: string;
  compareMemberName: string;
} => {
  if (!dimension || dimension.members.length < 2) {
    return {
      baseMemberName: "",
      compareMemberName: "",
    };
  }

  const preferredPairs = [
    ["Actual", "Budget"],
    ["Budget", "Actual"],
    ["Forecast", "Budget"],
    ["Jan", "Feb"],
    ["January", "February"],
  ] as const;

  for (const [baseName, compareName] of preferredPairs) {
    const baseMember = dimension.members.find((member) => {
      return member.name.toLowerCase() === baseName.toLowerCase();
    });
    const compareMember = dimension.members.find((member) => {
      return member.name.toLowerCase() === compareName.toLowerCase();
    });

    if (baseMember && compareMember && baseMember.name !== compareMember.name) {
      return {
        baseMemberName: baseMember.name,
        compareMemberName: compareMember.name,
      };
    }
  }

  return {
    baseMemberName: dimension.members[0]?.name ?? "",
    compareMemberName: dimension.members[1]?.name ?? "",
  };
};

const SummaryChip = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode => {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
      <span className="font-semibold text-slate-950">{value}</span> {label}
    </div>
  );
};

const LoadingState = (): ReactNode => {
  return (
    <div className="space-y-4">
      <div className="h-5 w-40 rounded-full bg-slate-200" />
      <div className="h-28 rounded-[1.5rem] bg-slate-100" />
      <div className="h-28 rounded-[1.5rem] bg-slate-100" />
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
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

const ErrorState = ({
  description,
  title,
}: {
  description: string;
  title: string;
}): ReactNode => {
  return (
    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6">
      <p className="font-medium text-rose-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
    </div>
  );
};

export { ComparatorPanel };
