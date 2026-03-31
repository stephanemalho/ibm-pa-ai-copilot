import "server-only";

import { getIbmPaMode } from "@/server/ibm-pa/env";
import { runMdx } from "@/server/ibm-pa/client";
import type {
  CubeDataPreviewFilter,
  CubeDataPreviewResult,
  GetCubeDataPreviewParams,
  MdxAxis,
  MdxCellValue,
  MdxTuple,
} from "@/server/ibm-pa/types";

const defaultRowLimit = 10;

const getCubeDataPreview = async (
  params: GetCubeDataPreviewParams,
): Promise<CubeDataPreviewResult> => {
  const rowLimit = params.rowLimit ?? defaultRowLimit;
  const mdx = buildCubeDataPreviewMdx({
    cubeName: params.cubeName,
    filters: params.filters,
    rowDimensionName: params.rowDimensionName,
    rowLimit,
    ...(params.rowDimensionHierarchyName
      ? {
          rowDimensionHierarchyName: params.rowDimensionHierarchyName,
        }
      : {}),
  });
  const mdxResult = await runMdx({
    cubeName: params.cubeName,
    mdx,
    ...(params.serverName
      ? {
          serverName: params.serverName,
        }
      : {}),
  });
  const rowsAxis = getRowsAxis(mdxResult.axes);
  const rows = rowsAxis.tuples.map((tuple, tupleIndex) => {
    const cell = mdxResult.cells[tupleIndex];
    const uniqueName = getPrimaryUniqueName(tuple);

    return {
      ...(cell?.formattedValue === undefined
        ? {}
        : {
            formattedValue: cell.formattedValue,
          }),
      memberName: getTupleLabel(tuple),
      ...(uniqueName
        ? {
            uniqueName,
          }
        : {}),
      value: (cell?.value ?? null) as MdxCellValue,
    };
  });

  return {
    cubeName: params.cubeName,
    filters: params.filters,
    mode: getIbmPaMode(),
    rowDimensionName: params.rowDimensionName,
    rows,
    serverName: mdxResult.serverName,
  };
};

const buildCubeDataPreviewMdx = (params: {
  cubeName: string;
  filters: CubeDataPreviewFilter[];
  rowDimensionHierarchyName?: string;
  rowDimensionName: string;
  rowLimit: number;
}): string => {
  const rowHierarchyName =
    params.rowDimensionHierarchyName ?? params.rowDimensionName;
  const escapedCubeName = escapeMdxIdentifier(params.cubeName);
  const escapedRowDimensionName = escapeMdxIdentifier(params.rowDimensionName);
  const escapedRowHierarchyName = escapeMdxIdentifier(rowHierarchyName);
  const rowSet = `HEAD(TM1SUBSETALL([${escapedRowDimensionName}].[${escapedRowHierarchyName}]), ${params.rowLimit})`;

  if (params.filters.length === 0) {
    return `SELECT ${rowSet} ON 0 FROM [${escapedCubeName}]`;
  }

  const filterTuple = params.filters
    .map((filter) => {
      const hierarchyName = filter.hierarchyName ?? filter.dimensionName;

      return `[${escapeMdxIdentifier(filter.dimensionName)}].[${escapeMdxIdentifier(hierarchyName)}].[${escapeMdxIdentifier(filter.memberName)}]`;
    })
    .join(", ");

  return `SELECT {(${filterTuple})} ON 0, ${rowSet} ON 1 FROM [${escapedCubeName}]`;
};

const getRowsAxis = (axes: MdxAxis[]): MdxAxis => {
  const axisWithRows = axes.find((axis) => axis.ordinal === 1);

  if (axisWithRows) {
    return axisWithRows;
  }

  return (
    axes.find((axis) => axis.ordinal === 0) ?? {
      ordinal: 0,
      tuples: [],
    }
  );
};

const getTupleLabel = (tuple: MdxTuple): string => {
  const primaryMember = tuple.members[tuple.members.length - 1];

  return (
    primaryMember?.elementName ??
    primaryMember?.name ??
    primaryMember?.uniqueName ??
    "Unnamed member"
  );
};

const getPrimaryUniqueName = (tuple: MdxTuple): string | undefined => {
  const primaryMember = tuple.members[tuple.members.length - 1];

  return primaryMember?.uniqueName;
};

const escapeMdxIdentifier = (value: string): string => {
  return value.replaceAll("]", "]]");
};

export { getCubeDataPreview };
