import {
  formatCount,
  formatMeasureValue,
  formatSignedNumber,
  formatVariance,
  getInsightTone,
  getNumericComparatorRows,
  getNumericPreviewRows,
} from "@/features/ibm-pa/lib/analysis-formatting";
import { getMemberSemanticDescriptor } from "@/features/ibm-pa/lib/semantic";
import type { InsightTone } from "@/features/ibm-pa/lib/analysis-formatting";
import type {
  CubeComparatorResponse,
  CubeComparatorRow,
  CubeDataPreviewResponse,
} from "@/shared/types/ibm-pa";

type AnalysisInsight = {
  id: string;
  metric: string;
  supportingText?: string | undefined;
  title: string;
  tone: InsightTone;
  valueLabel: string;
};

const derivePreviewInsights = (
  result: CubeDataPreviewResponse,
): AnalysisInsight[] => {
  const insights: AnalysisInsight[] = [];
  const numericRows = getNumericPreviewRows(result.rows);
  const topVisibleRow = result.rows[0];

  insights.push({
    id: "row-count",
    metric: formatCount(result.rows.length),
    supportingText: `${formatCount(result.filters.length)} fixed filters applied`,
    title: "Returned rows",
    tone: "neutral",
    valueLabel: result.rowDimensionName,
  });

  if (topVisibleRow) {
    insights.push({
      id: "top-visible-row",
      metric: formatMeasureValue(
        topVisibleRow.formattedValue,
        topVisibleRow.value,
      ),
      supportingText: "First visible row in the current preview",
      title: "Top visible row",
      tone: "neutral",
      valueLabel: getSemanticMemberLabel(topVisibleRow.memberName),
    });
  }

  if (numericRows.length === 0) {
    return insights;
  }

  const highestRow = numericRows.reduce((currentValue, row) => {
    return row.numericValue > currentValue.numericValue ? row : currentValue;
  });
  const lowestRow = numericRows.reduce((currentValue, row) => {
    return row.numericValue < currentValue.numericValue ? row : currentValue;
  });

  insights.unshift({
    id: "highest-value",
    metric: formatMeasureValue(highestRow.formattedValue, highestRow.value),
    supportingText: "Highest visible value in the current preview",
    title: "Highest value",
    tone: getInsightTone(highestRow.numericValue),
    valueLabel: getSemanticMemberLabel(highestRow.memberName),
  });

  if (lowestRow.memberName !== highestRow.memberName) {
    insights.splice(1, 0, {
      id: "lowest-value",
      metric: formatMeasureValue(lowestRow.formattedValue, lowestRow.value),
      supportingText: "Lowest visible value in the current preview",
      title: "Lowest value",
      tone: getInsightTone(lowestRow.numericValue),
      valueLabel: getSemanticMemberLabel(lowestRow.memberName),
    });
  }

  return insights.slice(0, 4);
};

const deriveComparatorInsights = (
  result: CubeComparatorResponse,
): AnalysisInsight[] => {
  const comparableRows = getNumericComparatorRows(result.rows);

  if (comparableRows.length === 0) {
    return [];
  }

  const deltaRows = comparableRows.filter((row) => row.deltaValue !== null);
  const varianceRows = comparableRows.filter((row) => {
    return (
      row.variancePercentage !== null && Number.isFinite(row.variancePercentage)
    );
  });
  const allRowsAreStable = deltaRows.every((row) => {
    return row.deltaValue === null || Math.abs(row.deltaValue) < 0.001;
  });

  if (allRowsAreStable) {
    return [
      {
        id: "stable-result",
        metric: "Stable result",
        supportingText:
          "No meaningful delta detected across the current comparison",
        title: "Nothing significant found",
        tone: "neutral",
        valueLabel: `${formatCount(result.rows.length)} rows reviewed`,
      },
    ];
  }

  const insights: AnalysisInsight[] = [];
  const largestPositiveRow = deltaRows
    .filter((row) => (row.deltaValue ?? 0) > 0)
    .reduce<CubeComparatorRow | null>((currentValue, row) => {
      if (
        currentValue === null ||
        (row.deltaValue ?? 0) > (currentValue.deltaValue ?? 0)
      ) {
        return row;
      }

      return currentValue;
    }, null);
  const largestNegativeRow = deltaRows
    .filter((row) => (row.deltaValue ?? 0) < 0)
    .reduce<CubeComparatorRow | null>((currentValue, row) => {
      if (
        currentValue === null ||
        (row.deltaValue ?? 0) < (currentValue.deltaValue ?? 0)
      ) {
        return row;
      }

      return currentValue;
    }, null);
  const strongestImpactRow = deltaRows.reduce((currentValue, row) => {
    return Math.abs(row.deltaValue ?? 0) >
      Math.abs(currentValue.deltaValue ?? 0)
      ? row
      : currentValue;
  });
  const highestVarianceRow = varianceRows.reduce<CubeComparatorRow | null>(
    (currentValue, row) => {
      if (
        currentValue === null ||
        (row.variancePercentage ?? Number.NEGATIVE_INFINITY) >
          (currentValue.variancePercentage ?? Number.NEGATIVE_INFINITY)
      ) {
        return row;
      }

      return currentValue;
    },
    null,
  );
  const lowestVarianceRow = varianceRows.reduce<CubeComparatorRow | null>(
    (currentValue, row) => {
      if (
        currentValue === null ||
        (row.variancePercentage ?? Number.POSITIVE_INFINITY) <
          (currentValue.variancePercentage ?? Number.POSITIVE_INFINITY)
      ) {
        return row;
      }

      return currentValue;
    },
    null,
  );

  if (largestPositiveRow && largestPositiveRow.deltaValue !== null) {
    insights.push({
      id: "largest-positive-delta",
      metric: formatSignedNumber(largestPositiveRow.deltaValue),
      supportingText: `Variance ${formatVariance(largestPositiveRow.variancePercentage)}`,
      title: "Largest positive delta",
      tone: "positive",
      valueLabel: getSemanticMemberLabel(largestPositiveRow.rowMemberName),
    });
  }

  if (largestNegativeRow && largestNegativeRow.deltaValue !== null) {
    insights.push({
      id: "largest-negative-delta",
      metric: formatSignedNumber(largestNegativeRow.deltaValue),
      supportingText: `Variance ${formatVariance(largestNegativeRow.variancePercentage)}`,
      title: "Largest negative delta",
      tone: "negative",
      valueLabel: getSemanticMemberLabel(largestNegativeRow.rowMemberName),
    });
  }

  if (strongestImpactRow.deltaValue !== null) {
    insights.push({
      id: "strongest-business-impact",
      metric: formatSignedNumber(strongestImpactRow.deltaValue),
      supportingText: `Largest absolute change across ${formatCount(result.rows.length)} rows`,
      title: "Strongest business impact",
      tone: getInsightTone(strongestImpactRow.deltaValue),
      valueLabel: getSemanticMemberLabel(strongestImpactRow.rowMemberName),
    });
  }

  if (highestVarianceRow && highestVarianceRow.variancePercentage !== null) {
    insights.push({
      id: "highest-variance",
      metric: formatVariance(highestVarianceRow.variancePercentage),
      supportingText: `Delta ${formatSignedNumber(highestVarianceRow.deltaValue)}`,
      title: "Highest variance",
      tone: getInsightTone(highestVarianceRow.variancePercentage),
      valueLabel: getSemanticMemberLabel(highestVarianceRow.rowMemberName),
    });
  }

  if (
    lowestVarianceRow &&
    lowestVarianceRow.variancePercentage !== null &&
    lowestVarianceRow.rowMemberName !== highestVarianceRow?.rowMemberName
  ) {
    insights.push({
      id: "lowest-variance",
      metric: formatVariance(lowestVarianceRow.variancePercentage),
      supportingText: `Delta ${formatSignedNumber(lowestVarianceRow.deltaValue)}`,
      title: "Lowest variance",
      tone: getInsightTone(lowestVarianceRow.variancePercentage),
      valueLabel: getSemanticMemberLabel(lowestVarianceRow.rowMemberName),
    });
  }

  return insights.slice(0, 5);
};

const getSemanticMemberLabel = (memberName: string): string => {
  return getMemberSemanticDescriptor({
    name: memberName,
  }).displayLabel;
};

export {
  deriveComparatorInsights,
  derivePreviewInsights,
  type AnalysisInsight,
};
