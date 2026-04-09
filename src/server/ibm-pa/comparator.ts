import "server-only";

import { runMdx } from "@/server/ibm-pa/client";
import { getIbmPaMode } from "@/server/ibm-pa/env";
import type {
  GetCubeComparatorParams,
  CubeComparatorResult,
  CubeComparatorRow,
  MdxAxis,
  MdxCell,
  MdxCellValue,
  MdxTuple,
} from "@/server/ibm-pa/types";

const defaultRowLimit = 12;

const getCubeComparator = async (
  params: GetCubeComparatorParams,
): Promise<CubeComparatorResult> => {
  const rowLimit = params.rowLimit ?? defaultRowLimit;
  const mdx = buildCubeComparatorMdx({
    baseMemberName: params.baseMemberName,
    compareMemberName: params.compareMemberName,
    comparisonDimensionName: params.comparisonDimensionName,
    contextFilters: params.contextFilters,
    cubeName: params.cubeName,
    rowDimensionName: params.rowDimensionName,
    rowLimit,
    ...(params.comparisonDimensionHierarchyName
      ? {
          comparisonDimensionHierarchyName:
            params.comparisonDimensionHierarchyName,
        }
      : {}),
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
  const columnAxis = getAxisByOrdinal(mdxResult.axes, 0);
  const rowAxis = getAxisByOrdinal(mdxResult.axes, 1);
  const columnCount = Math.max(columnAxis.tuples.length, 1);
  const rows = rowAxis.tuples.map((tuple, rowIndex) => {
    const baseCell = mdxResult.cells[getCellIndex(rowIndex, 0, columnCount)];
    const compareCell = mdxResult.cells[getCellIndex(rowIndex, 1, columnCount)];

    return buildComparatorRow({
      baseCell,
      compareCell,
      rowTuple: tuple,
    });
  });

  return {
    baseMemberName: params.baseMemberName,
    compareMemberName: params.compareMemberName,
    comparisonDimensionName: params.comparisonDimensionName,
    contextFilters: params.contextFilters,
    cubeName: params.cubeName,
    mode: getIbmPaMode(),
    rowDimensionName: params.rowDimensionName,
    rows,
    serverName: mdxResult.serverName,
  };
};

const buildCubeComparatorMdx = (params: {
  baseMemberName: string;
  compareMemberName: string;
  comparisonDimensionHierarchyName?: string;
  comparisonDimensionName: string;
  contextFilters: GetCubeComparatorParams["contextFilters"];
  cubeName: string;
  rowDimensionHierarchyName?: string;
  rowDimensionName: string;
  rowLimit: number;
}): string => {
  const rowHierarchyName =
    params.rowDimensionHierarchyName ?? params.rowDimensionName;
  const comparisonHierarchyName =
    params.comparisonDimensionHierarchyName ?? params.comparisonDimensionName;
  const escapedCubeName = escapeMdxIdentifier(params.cubeName);
  const escapedRowDimensionName = escapeMdxIdentifier(params.rowDimensionName);
  const escapedRowHierarchyName = escapeMdxIdentifier(rowHierarchyName);
  const escapedComparisonDimensionName = escapeMdxIdentifier(
    params.comparisonDimensionName,
  );
  const escapedComparisonHierarchyName = escapeMdxIdentifier(
    comparisonHierarchyName,
  );
  const rowSet = `HEAD(TM1SUBSETALL([${escapedRowDimensionName}].[${escapedRowHierarchyName}]), ${params.rowLimit})`;
  const baseMemberRef = `[${escapedComparisonDimensionName}].[${escapedComparisonHierarchyName}].[${escapeMdxIdentifier(params.baseMemberName)}]`;
  const compareMemberRef = `[${escapedComparisonDimensionName}].[${escapedComparisonHierarchyName}].[${escapeMdxIdentifier(params.compareMemberName)}]`;
  const contextTuple = params.contextFilters
    .map((filter) => {
      const hierarchyName = filter.hierarchyName ?? filter.dimensionName;

      return `[${escapeMdxIdentifier(filter.dimensionName)}].[${escapeMdxIdentifier(hierarchyName)}].[${escapeMdxIdentifier(filter.memberName)}]`;
    })
    .join(", ");
  const columnsSet =
    contextTuple.length === 0
      ? `{${baseMemberRef}, ${compareMemberRef}}`
      : `{(${baseMemberRef}, ${contextTuple}), (${compareMemberRef}, ${contextTuple})}`;

  return `SELECT ${columnsSet} ON 0, ${rowSet} ON 1 FROM [${escapedCubeName}]`;
};

const buildComparatorRow = (params: {
  baseCell?: MdxCell | undefined;
  compareCell?: MdxCell | undefined;
  rowTuple: MdxTuple;
}): CubeComparatorRow => {
  const baseValue = (params.baseCell?.value ?? null) as MdxCellValue;
  const compareValue = (params.compareCell?.value ?? null) as MdxCellValue;
  const baseNumericValue = getNumericValue(baseValue);
  const compareNumericValue = getNumericValue(compareValue);
  const deltaValue =
    baseNumericValue === null || compareNumericValue === null
      ? null
      : compareNumericValue - baseNumericValue;
  const variancePercentage =
    deltaValue === null || baseNumericValue === null || baseNumericValue === 0
      ? null
      : (deltaValue / baseNumericValue) * 100;

  return {
    ...(params.baseCell?.formattedValue === undefined
      ? {}
      : {
          baseFormattedValue: params.baseCell.formattedValue,
        }),
    baseValue,
    ...(params.compareCell?.formattedValue === undefined
      ? {}
      : {
          compareFormattedValue: params.compareCell.formattedValue,
        }),
    compareValue,
    deltaValue,
    rowMemberName: getTupleLabel(params.rowTuple),
    ...(getPrimaryUniqueName(params.rowTuple)
      ? {
          rowUniqueName: getPrimaryUniqueName(params.rowTuple),
        }
      : {}),
    variancePercentage,
  };
};

const getAxisByOrdinal = (axes: MdxAxis[], ordinal: number): MdxAxis => {
  return (
    axes.find((axis) => axis.ordinal === ordinal) ?? {
      ordinal,
      tuples: [],
    }
  );
};

const getCellIndex = (
  rowIndex: number,
  columnIndex: number,
  columnCount: number,
): number => {
  return rowIndex * columnCount + columnIndex;
};

const getNumericValue = (value: MdxCellValue): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
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

export { getCubeComparator };
