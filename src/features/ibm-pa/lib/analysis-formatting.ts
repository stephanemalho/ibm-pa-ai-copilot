import type { CubeComparatorRow, CubeDataPreviewRow } from "@/shared/types/ibm-pa";

type InsightTone = "negative" | "neutral" | "positive";

const formatMeasureValue = (
  formattedValue: string | null | undefined,
  rawValue: boolean | null | number | string,
): string => {
  const numericValue = getNumericValue(rawValue);

  if (numericValue !== null) {
    if (
      typeof formattedValue === "string" &&
      formattedValue.trim().length > 0 &&
      /[^0-9.,+\-() ]/.test(formattedValue)
    ) {
      return formattedValue;
    }

    return formatNumber(numericValue);
  }

  if (formattedValue && formattedValue.trim().length > 0) {
    return formattedValue;
  }

  if (rawValue === null) {
    return "-";
  }

  return String(rawValue);
};

const formatSignedNumber = (value: number | null): string => {
  if (value === null) {
    return "-";
  }

  return formatNumber(value, {
    signDisplay: "exceptZero",
  });
};

const formatVariance = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  })}%`;
};

const formatCount = (value: number): string => {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (
  value: number,
  overrides?: Intl.NumberFormatOptions | undefined,
): string => {
  const absoluteValue = Math.abs(value);
  const minimumFractionDigits =
    absoluteValue !== 0 && absoluteValue < 1 ? 2 : 0;
  const maximumFractionDigits =
    absoluteValue !== 0 && absoluteValue < 1 ? 4 : 2;

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits,
    ...overrides,
  }).format(value);
};

const getNumericValue = (value: boolean | null | number | string): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const normalizedValue = value.replaceAll(",", "");
    const parsedValue = Number(normalizedValue);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
};

const getNumericPreviewRows = (
  rows: CubeDataPreviewRow[],
): Array<
  CubeDataPreviewRow & {
    numericValue: number;
  }
> => {
  return rows.flatMap((row) => {
    const numericValue = getNumericValue(row.value);

    if (numericValue === null) {
      return [];
    }

    return [
      {
        ...row,
        numericValue,
      },
    ];
  });
};

const getNumericComparatorRows = (
  rows: CubeComparatorRow[],
): Array<
  CubeComparatorRow & {
    baseNumericValue: number;
    compareNumericValue: number;
  }
> => {
  return rows.flatMap((row) => {
    const baseNumericValue = getNumericValue(row.baseValue);
    const compareNumericValue = getNumericValue(row.compareValue);

    if (baseNumericValue === null || compareNumericValue === null) {
      return [];
    }

    return [
      {
        ...row,
        baseNumericValue,
        compareNumericValue,
      },
    ];
  });
};

const getInsightTone = (value: number | null): InsightTone => {
  if (value === null || Math.abs(value) < 0.001) {
    return "neutral";
  }

  if (value > 0) {
    return "positive";
  }

  return "negative";
};

export {
  formatCount,
  formatMeasureValue,
  formatSignedNumber,
  formatVariance,
  getInsightTone,
  getNumericComparatorRows,
  getNumericPreviewRows,
  getNumericValue,
  type InsightTone,
};
