import { getManualSemanticOverride } from "@/features/ibm-pa/lib/semantic-dictionary";
import type {
  CubeAccessibilityDiagnostic,
  CubeDimensionStructureDiagnostic,
  DimensionAccessibilityDiagnostic,
  Tm1AttributeMap,
  Tm1LocalizedAttributeMap,
  Tm1Member,
} from "@/shared/types/ibm-pa";

type SemanticSource = "manual" | "tm1-caption" | "heuristic" | "raw-name";

type SemanticKind =
  | "Time"
  | "Version"
  | "Scenario"
  | "Measure"
  | "Product"
  | "Entity"
  | "Currency"
  | "Technical"
  | "Unknown";

type SemanticQuality = "rich" | "partial" | "recommended";

type SemanticDescriptor = {
  description: string;
  displayLabel: string;
  quality: SemanticQuality;
  qualityLabel: string;
  semanticKind: SemanticKind;
  semanticSource: SemanticSource;
  sourceLabel: string;
  technicalName: string;
  uniqueName: string;
  usageHint: string;
};

type SemanticEntityKind = "cube" | "dimension" | "member";

type SemanticInput = {
  attributes?: Tm1AttributeMap | undefined;
  caption?: string | undefined;
  entityKind: SemanticEntityKind;
  localizedAttributes?: Tm1LocalizedAttributeMap | undefined;
  name: string;
  uniqueName?: string | undefined;
};

const defaultDescription = "Description not provided";
const defaultUsageHint = "Usage not specified";
const defaultUniqueName = "N/A";

const getCubeSemanticDescriptor = (
  cube: Pick<
    CubeAccessibilityDiagnostic,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
): SemanticDescriptor => {
  return buildSemanticDescriptor({
    ...cube,
    entityKind: "cube",
  });
};

const getDimensionSemanticDescriptor = (
  dimension: Pick<
    | CubeDimensionStructureDiagnostic
    | DimensionAccessibilityDiagnostic,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
): SemanticDescriptor => {
  return buildSemanticDescriptor({
    ...dimension,
    entityKind: "dimension",
  });
};

const getMemberSemanticDescriptor = (
  member: Pick<
    Tm1Member,
    "attributes" | "caption" | "localizedAttributes" | "name" | "uniqueName"
  >,
): SemanticDescriptor => {
  return buildSemanticDescriptor({
    ...member,
    entityKind: "member",
  });
};

const buildSemanticDescriptor = (input: SemanticInput): SemanticDescriptor => {
  const manualOverride = getManualSemanticOverride(
    input.entityKind === "cube" ? "cubes" : "dimensions",
    input.name,
  );
  const normalizedTechnicalName = cleanSemanticText(input.name) ?? input.name;
  const caption = resolveTm1Caption(input);
  const humanizedLabel = humanizeTechnicalName(normalizedTechnicalName);
  const displayLabel =
    cleanSemanticText(manualOverride?.businessLabel) ??
    caption ??
    humanizedLabel ??
    normalizedTechnicalName;
  const semanticSource: SemanticSource = manualOverride?.businessLabel
    ? "manual"
    : caption
      ? "tm1-caption"
      : humanizedLabel && humanizedLabel !== normalizedTechnicalName
        ? "heuristic"
        : "raw-name";
  const semanticKind =
    manualOverride?.semanticKind ??
    inferSemanticKind({
      caption,
      entityKind: input.entityKind,
      name: normalizedTechnicalName,
    });
  const description =
    cleanSemanticText(manualOverride?.description) ??
    buildGeneratedDescription({
      entityKind: input.entityKind,
      semanticKind,
    }) ??
    defaultDescription;
  const usageHint =
    cleanSemanticText(manualOverride?.usageHint) ??
    buildGeneratedUsageHint({
      entityKind: input.entityKind,
      semanticKind,
    }) ??
    defaultUsageHint;
  const quality = inferSemanticQuality({
    hasCaption: Boolean(caption),
    hasManualOverride: Boolean(manualOverride),
    hasUniqueName: Boolean(cleanSemanticText(input.uniqueName)),
    semanticSource,
  });

  return {
    description,
    displayLabel,
    quality,
    qualityLabel: getSemanticQualityLabel(quality),
    semanticKind,
    semanticSource,
    sourceLabel: getSemanticSourceLabel(semanticSource),
    technicalName: normalizedTechnicalName,
    uniqueName: cleanSemanticText(input.uniqueName) ?? defaultUniqueName,
    usageHint,
  };
};

const resolveTm1Caption = (input: SemanticInput): string | undefined => {
  const explicitCaption = cleanSemanticText(input.caption);

  if (explicitCaption) {
    return explicitCaption;
  }

  const directCaption = resolveCaptionFromAttributes(input.attributes);

  if (directCaption) {
    return directCaption;
  }

  if (!input.localizedAttributes) {
    return undefined;
  }

  for (const localizedAttributes of input.localizedAttributes) {
    const localizedCaption = resolveCaptionFromAttributes(localizedAttributes);

    if (localizedCaption) {
      return localizedCaption;
    }
  }

  return undefined;
};

const resolveCaptionFromAttributes = (
  attributes?: Tm1AttributeMap | undefined,
): string | undefined => {
  if (!attributes) {
    return undefined;
  }

  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    const normalizedAttributeName =
      attributeName.split(".").at(-1)?.toLowerCase() ?? attributeName.toLowerCase();

    if (
      normalizedAttributeName === "caption" ||
      normalizedAttributeName === "label" ||
      normalizedAttributeName === "title"
    ) {
      return cleanSemanticText(attributeValue);
    }
  }

  const nameValue = attributes.Name ?? attributes.name;
  const valueValue = attributes.Value ?? attributes.value;

  if (
    typeof nameValue === "string" &&
    typeof valueValue === "string" &&
    nameValue.toLowerCase() === "caption"
  ) {
    return cleanSemanticText(valueValue);
  }

  return undefined;
};

const cleanSemanticText = (value?: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  let currentValue = value.trim();

  if (currentValue.length === 0) {
    return undefined;
  }

  for (let index = 0; index < 2; index += 1) {
    const repairedValue = repairPotentialMojibake(currentValue);

    if (repairedValue === currentValue) {
      break;
    }

    currentValue = repairedValue;
  }

  return currentValue;
};

const repairPotentialMojibake = (value: string): string => {
  if (!/[ÃÂâ]/.test(value)) {
    return value;
  }

  const bytes = Uint8Array.from(value, (character) => {
    return character.charCodeAt(0) & 0xff;
  });
  const decodedValue = new TextDecoder().decode(bytes);

  if (decodedValue.includes("\uFFFD")) {
    return value;
  }

  const originalSignals = countEncodingSignals(value);
  const decodedSignals = countEncodingSignals(decodedValue);

  return decodedSignals <= originalSignals ? decodedValue : value;
};

const countEncodingSignals = (value: string): number => {
  return (value.match(/[ÃÂâ]/g) ?? []).length;
};

const humanizeTechnicalName = (value: string): string => {
  const withoutSystemPrefix = value.startsWith("}") ? value.slice(1) : value;
  const normalizedValue = withoutSystemPrefix
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedValue.length === 0) {
    return value;
  }

  return normalizedValue.replace(/\b\w/g, (character) => {
    return character.toUpperCase();
  });
};

const inferSemanticKind = (input: {
  caption?: string | undefined;
  entityKind: SemanticEntityKind;
  name: string;
}): SemanticKind => {
  const candidateValue = `${input.name} ${input.caption ?? ""}`.toLowerCase();

  if (input.name.startsWith("}")) {
    return "Technical";
  }

  if (/\b(time|year|quarter|month|week|day|period)\b/.test(candidateValue)) {
    return "Time";
  }

  if (/\b(version|actual|budget|forecast|plan)\b/.test(candidateValue)) {
    return input.entityKind === "cube" ? "Scenario" : "Version";
  }

  if (/\b(scenario|what if)\b/.test(candidateValue)) {
    return "Scenario";
  }

  if (/\b(account|measure|metric|kpi|amount|revenue|margin)\b/.test(candidateValue)) {
    return "Measure";
  }

  if (/\b(product|sku|item|brand)\b/.test(candidateValue)) {
    return "Product";
  }

  if (/\b(entity|company|cost center|business unit|organisation|organization)\b/.test(candidateValue)) {
    return "Entity";
  }

  if (/\b(currency|fx|exchange rate)\b/.test(candidateValue)) {
    return "Currency";
  }

  return "Unknown";
};

const buildGeneratedDescription = (input: {
  entityKind: SemanticEntityKind;
  semanticKind: SemanticKind;
}): string | undefined => {
  switch (input.semanticKind) {
    case "Time":
      return "Time-oriented structure used to analyze values by reporting period.";
    case "Version":
      return "Version-oriented structure used to compare planning or actual states.";
    case "Scenario":
      return "Scenario-oriented business object used for planning comparisons.";
    case "Measure":
      return "Measure-oriented business object used to inspect numeric performance values.";
    case "Product":
      return "Product-oriented structure used to organize commercial analysis.";
    case "Entity":
      return "Entity-oriented structure used to scope analysis by organization or business unit.";
    case "Currency":
      return "Currency-oriented structure used to compare or convert reported values.";
    case "Technical":
      return "Technical TM1 object intended primarily for system or model administration.";
    default:
      return input.entityKind === "member"
        ? "Description not provided"
        : undefined;
  }
};

const buildGeneratedUsageHint = (input: {
  entityKind: SemanticEntityKind;
  semanticKind: SemanticKind;
}): string | undefined => {
  switch (input.semanticKind) {
    case "Time":
      return "Use this when slicing or comparing results across reporting periods.";
    case "Version":
      return "Use this when comparing actuals, budgets, forecasts, or plan versions.";
    case "Scenario":
      return "Use this when understanding which planning scenario the data belongs to.";
    case "Measure":
      return "Use this to choose which metric or account line should be analyzed.";
    case "Product":
      return "Use this to scope analysis to products, brands, or commercial lines.";
    case "Entity":
      return "Use this to focus analysis on the right organizational perimeter.";
    case "Currency":
      return "Use this when reviewing values across one or more currencies.";
    case "Technical":
      return "Use with care because this object looks technical rather than business-facing.";
    default:
      return input.entityKind === "member" ? defaultUsageHint : undefined;
  }
};

const inferSemanticQuality = (input: {
  hasCaption: boolean;
  hasManualOverride: boolean;
  hasUniqueName: boolean;
  semanticSource: SemanticSource;
}): SemanticQuality => {
  if (
    input.hasManualOverride ||
    (input.semanticSource === "tm1-caption" && input.hasUniqueName)
  ) {
    return "rich";
  }

  if (input.hasCaption || input.semanticSource === "heuristic") {
    return "partial";
  }

  return "recommended";
};

const getSemanticSourceLabel = (semanticSource: SemanticSource): string => {
  switch (semanticSource) {
    case "manual":
      return "Manual override";
    case "tm1-caption":
      return "TM1 caption";
    case "heuristic":
      return "Heuristic label";
    case "raw-name":
      return "Raw name";
  }
};

const getSemanticQualityLabel = (quality: SemanticQuality): string => {
  switch (quality) {
    case "rich":
      return "Rich semantic metadata";
    case "partial":
      return "Partial semantic metadata";
    case "recommended":
      return "Manual enrichment recommended";
  }
};

const getMemberTechnicalName = (member: Tm1Member): string => {
  return cleanSemanticText(member.name) ?? member.name;
};

export {
  cleanSemanticText,
  defaultDescription,
  defaultUniqueName,
  defaultUsageHint,
  getCubeSemanticDescriptor,
  getDimensionSemanticDescriptor,
  getMemberSemanticDescriptor,
  getMemberTechnicalName,
  getSemanticQualityLabel,
  getSemanticSourceLabel,
  humanizeTechnicalName,
};
export type {
  SemanticDescriptor,
  SemanticKind,
  SemanticQuality,
  SemanticSource,
};
