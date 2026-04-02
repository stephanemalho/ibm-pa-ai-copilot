"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  cubeDataPreviewResponseSchema,
  dimensionAccessibilityResponseSchema,
  routeErrorSchema,
} from "@/features/ibm-pa/lib/route-schemas";
import { appRoutes } from "@/shared/lib/routes";
import type {
  CubeDataPreviewResponse,
  DimensionAccessibilityDiagnostic,
} from "@/shared/types/ibm-pa";

type DataPreviewPanelProps = {
  cubeName: string;
  selectedDimensionName?: string | null | undefined;
  serverName: string;
};

type PreviewDimensionsState =
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

type PreviewState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
    }
  | {
      data: CubeDataPreviewResponse;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

type FilterSelectionMap = Record<string, string>;

const dimensionSampleSize = 12;

const DataPreviewPanel = ({
  cubeName,
  selectedDimensionName,
  serverName,
}: DataPreviewPanelProps): ReactNode => {
  const [previewDimensionsState, setPreviewDimensionsState] =
    useState<PreviewDimensionsState>({
      status: "loading",
    });
  const [rowDimensionName, setRowDimensionName] = useState<string | null>(null);
  const [filterSelections, setFilterSelections] = useState<FilterSelectionMap>(
    {},
  );
  const [previewState, setPreviewState] = useState<PreviewState>({
    status: "idle",
  });
  const accessibleDimensions = useMemo(() => {
    return previewDimensionsState.status === "success"
      ? previewDimensionsState.dimensions.filter((dimension) => dimension.reachable)
      : [];
  }, [previewDimensionsState]);

  useEffect(() => {
    let isActive = true;

    const loadPreviewDimensions = async (): Promise<void> => {
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

          setPreviewDimensionsState({
            message: parsedError.success
              ? parsedError.data.error.message
              : "Unable to load preview dimensions.",
            status: "error",
          });
          return;
        }

        const parsedPayload = dimensionAccessibilityResponseSchema.parse(payload);

        if (!isActive) {
          return;
        }

        setPreviewDimensionsState({
          dimensions: parsedPayload.dimensions,
          status: "success",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPreviewDimensionsState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to load preview dimensions.",
          status: "error",
        });
      }
    };

    void loadPreviewDimensions();

    return () => {
      isActive = false;
    };
  }, [cubeName, serverName]);
  const defaultRowDimensionName = useMemo(() => {
    return getDefaultRowDimensionName(accessibleDimensions, selectedDimensionName);
  }, [accessibleDimensions, selectedDimensionName]);
  const activeRowDimensionName = rowDimensionName ?? defaultRowDimensionName;
  const filterDimensions = accessibleDimensions.filter(
    (dimension) =>
      dimension.name !== activeRowDimensionName && dimension.members.length > 0,
  );
  const unconstrainedDimensions =
    previewDimensionsState.status === "success"
      ? previewDimensionsState.dimensions.filter((dimension) => {
          if (dimension.name === activeRowDimensionName) {
            return false;
          }

          return !dimension.reachable || dimension.members.length === 0;
        })
      : [];
  const previewFilters = filterDimensions.flatMap((dimension) => {
    const selectedMember = filterSelections[dimension.name] ?? dimension.members[0];

    if (!selectedMember) {
      return [];
    }

    return [
      {
        dimensionName: dimension.name,
        ...(dimension.hierarchyName
          ? {
              hierarchyName: dimension.hierarchyName,
            }
          : {}),
        memberName: selectedMember,
      },
    ];
  });

  const handlePreview = async (): Promise<void> => {
    if (!activeRowDimensionName) {
      return;
    }

    const selectedRowDimension = accessibleDimensions.find(
      (dimension) => dimension.name === activeRowDimensionName,
    );

    setPreviewState({
      status: "loading",
    });

    try {
      const response = await fetch(appRoutes.ibmDataPreview, {
        body: JSON.stringify({
          cubeName,
          filters: previewFilters,
          ...(selectedRowDimension?.hierarchyName
            ? {
                rowDimensionHierarchyName: selectedRowDimension.hierarchyName,
              }
            : {}),
          rowDimensionName: activeRowDimensionName,
          rowLimit: 10,
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

        setPreviewState({
          message: parsedError.success
            ? parsedError.data.error.message
            : "Unable to load the data preview.",
          status: "error",
        });
        return;
      }

      const parsedPayload = cubeDataPreviewResponseSchema.parse(payload);

      setPreviewState({
        data: parsedPayload,
        status: "success",
      });
    } catch (error) {
      setPreviewState({
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the data preview.",
        status: "error",
      });
    }
  };

  return (
    <Card className="border-slate-200/80 bg-white/90">
      <CardHeader>
        <CardTitle className="text-xl">Data Preview</CardTitle>
        <CardDescription>
          Move from schema understanding to guided read-only cube exploration by
          choosing a row dimension and a simple context for the remaining
          dimensions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {previewDimensionsState.status === "loading" ? (
          <LoadingState />
        ) : previewDimensionsState.status === "error" ? (
          <ErrorState
            description={previewDimensionsState.message}
            title="Preview builder unavailable"
          />
        ) : accessibleDimensions.length === 0 || !activeRowDimensionName ? (
          <EmptyState
            description="No accessible dimensions are available yet for a guided data preview."
            title="No preview dimensions"
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <SummaryChip
                label="Accessible dimensions"
                value={accessibleDimensions.length.toString()}
              />
              <SummaryChip
                label="Context selectors"
                value={filterDimensions.length.toString()}
              />
              <SummaryChip
                label="Unconstrained dimensions"
                value={unconstrainedDimensions.length.toString()}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Guided query builder
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      Choose the row axis, keep one member as context for the
                      other dimensions when available, then trigger a read-only
                      preview.
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    <Field label="Row dimension">
                      <Select
                        onChange={(event) => {
                          setRowDimensionName(event.target.value);
                          setPreviewState({
                            status: "idle",
                          });
                        }}
                        value={activeRowDimensionName}
                      >
                        {accessibleDimensions.map((dimension) => (
                          <option key={dimension.name} value={dimension.name}>
                            {dimension.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-700">
                        Context members
                      </p>

                      {filterDimensions.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                          No additional dimension needs a context member for
                          this preview.
                        </div>
                      ) : (
                        filterDimensions.map((dimension) => {
                          const selectedMember =
                            filterSelections[dimension.name] ??
                            dimension.members[0] ??
                            "";

                          return (
                            <Field
                              key={dimension.name}
                              label={`${dimension.name}${dimension.members.length > 0 ? ` (${dimension.members.length} sample members)` : ""}`}
                            >
                              <Select
                                disabled={dimension.members.length === 0}
                                onChange={(event) => {
                                  setFilterSelections((currentValue) => ({
                                    ...currentValue,
                                    [dimension.name]: event.target.value,
                                  }));
                                  setPreviewState({
                                    status: "idle",
                                  });
                                }}
                                value={selectedMember}
                              >
                                {dimension.members.length === 0 ? (
                                  <option value="">No sample members</option>
                                ) : (
                                  dimension.members.map((member) => (
                                    <option key={member} value={member}>
                                      {member}
                                    </option>
                                  ))
                                )}
                              </Select>
                            </Field>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">
                      <p>
                        Cube:{" "}
                        <span className="font-medium text-slate-950">
                          {cubeName}
                        </span>
                      </p>
                      <p>
                        Server:{" "}
                        <span className="font-medium text-slate-950">
                          {serverName}
                        </span>
                      </p>
                    </div>

                    <Button onClick={() => void handlePreview()} type="button">
                      Preview data
                    </Button>
                  </div>
                </div>

                {unconstrainedDimensions.length > 0 ? (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-900">
                      Limited context
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Some dimensions cannot currently provide a context member,
                      so the preview remains constrained only where metadata is
                      available.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {unconstrainedDimensions.map((dimension) => (
                        <span
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                          key={dimension.name}
                        >
                          {dimension.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Preview result
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The preview stays read-only and uses an existing server-side
                    route built from the cube context selected above.
                  </p>
                </div>

                {renderPreviewResult({
                  previewState,
                  rowDimensionName: activeRowDimensionName,
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const renderPreviewResult = (params: {
  previewState: PreviewState;
  rowDimensionName: string;
}): ReactNode => {
  if (params.previewState.status === "idle") {
    return (
      <EmptyState
        description="Choose a row dimension and context members, then run a preview to read live cube values."
        title="No preview yet"
      />
    );
  }

  if (params.previewState.status === "loading") {
    return <LoadingState />;
  }

  if (params.previewState.status === "error") {
    return (
      <ErrorState
        description={params.previewState.message}
        title="Preview failed"
      />
    );
  }

  if (params.previewState.data.rows.length === 0) {
    return (
      <EmptyState
        description="The query completed successfully, but no cube cells were returned for this preview."
        title="No preview rows"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SummaryChip
          label="Returned rows"
          value={params.previewState.data.rows.length.toString()}
        />
        <SummaryChip
          label="Applied filters"
          value={params.previewState.data.filters.length.toString()}
        />
        <SummaryChip label="Mode" value={params.previewState.data.mode} />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  {params.rowDimensionName}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {params.previewState.data.rows.map((row) => (
                <tr
                  className="align-top"
                  key={row.uniqueName ?? row.memberName}
                >
                  <td className="px-4 py-3 text-slate-900">
                    <div className="space-y-1">
                      <p className="font-medium">{row.memberName}</p>
                      {row.uniqueName ? (
                        <p className="text-xs text-slate-500">
                          {row.uniqueName}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.formattedValue ?? String(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {params.previewState.data.filters.length > 0 ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Applied context</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {params.previewState.data.filters.map((filter) => (
              <span
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                key={`${filter.dimensionName}-${filter.memberName}`}
              >
                {filter.dimensionName}: {filter.memberName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const getDefaultRowDimensionName = (
  dimensions: DimensionAccessibilityDiagnostic[],
  selectedDimensionName?: string | null,
): string | null => {
  if (
    selectedDimensionName &&
    dimensions.some((dimension) => dimension.name === selectedDimensionName)
  ) {
    return selectedDimensionName;
  }

  return dimensions[0]?.name ?? null;
};

const Field = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}): ReactNode => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
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

export { DataPreviewPanel };
