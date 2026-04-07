import { z } from "zod";

const tm1AttributeMapSchema = z.record(z.string(), z.string());

const tm1LocalizedAttributeMapSchema = z.array(tm1AttributeMapSchema);

const tm1HierarchyMetadataSchema = z.object({
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  cardinality: z.number().optional(),
  defaultMemberName: z.string().optional(),
  levelNames: z.array(z.string()).optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  name: z.string(),
  structure: z.string().optional(),
  uniqueName: z.string().optional(),
  visible: z.boolean().optional(),
});

const tm1MemberSchema = z.object({
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  index: z.number().optional(),
  isPlaceholder: z.boolean().optional(),
  level: z.number().optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  name: z.string(),
  ordinal: z.number().optional(),
  type: z.string().optional(),
  uniqueName: z.string().optional(),
  weight: z.number().optional(),
});

const serverAccessibilityDiagnosticSchema = z.object({
  kind: z.enum(["server", "cube", "dimension"]),
  classification: z.enum([
    "accessible",
    "authenticated_but_not_authorized",
    "server_not_reachable_by_endpoint",
    "unexpected_upstream_error",
  ]),
  message: z.string(),
  name: z.string(),
  reachable: z.boolean(),
  statusCode: z.number().int().optional(),
});

const serverAccessibilityResponseSchema = z.object({
  mode: z.enum(["live", "mock"]),
  servers: z.array(serverAccessibilityDiagnosticSchema),
});

const cubeSummarySchema = z.object({
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  cubeType: z.string().optional(),
  lastDataUpdate: z.string().optional(),
  lastSchemaUpdate: z.string().optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  name: z.string(),
  serverName: z.string(),
  uniqueName: z.string().optional(),
});

const cubesResponseSchema = z.object({
  cubes: z.array(cubeSummarySchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeAccessibilityDiagnosticSchema = cubeSummarySchema.extend({
  kind: z.enum(["server", "cube", "dimension"]),
  classification: z.enum([
    "accessible",
    "authenticated_but_not_authorized",
    "server_not_reachable_by_endpoint",
    "unexpected_upstream_error",
  ]),
  message: z.string(),
  reachable: z.boolean(),
  statusCode: z.number().int().optional(),
});

const cubeAccessibilityResponseSchema = z.object({
  cubes: z.array(cubeAccessibilityDiagnosticSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeDimensionSchema = z.object({
  allLeavesHierarchyName: z.string().optional(),
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  cubeName: z.string(),
  dimensionName: z.string().optional(),
  hierarchy: tm1HierarchyMetadataSchema.optional(),
  hierarchyName: z.string().optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  name: z.string(),
  serverName: z.string(),
  uniqueName: z.string().optional(),
});

const cubeSampleMemberSetSchema = z.object({
  cubeName: z.string(),
  dimensionName: z.string(),
  hierarchyName: z.string(),
  members: z.array(tm1MemberSchema),
  serverName: z.string(),
});

const cubeDataPreviewFilterSchema = z.object({
  dimensionName: z.string(),
  hierarchyName: z.string().optional(),
  memberName: z.string(),
});

const cubeComparatorFilterSchema = z.object({
  dimensionName: z.string(),
  hierarchyName: z.string().optional(),
  memberName: z.string(),
});

const cubeDataPreviewRowSchema = z.object({
  formattedValue: z.string().nullable().optional(),
  memberName: z.string(),
  uniqueName: z.string().optional(),
  value: z.union([z.boolean(), z.null(), z.number(), z.string()]),
});

const cubeComparatorRowSchema = z.object({
  baseFormattedValue: z.string().nullable().optional(),
  baseValue: z.union([z.boolean(), z.null(), z.number(), z.string()]),
  compareFormattedValue: z.string().nullable().optional(),
  compareValue: z.union([z.boolean(), z.null(), z.number(), z.string()]),
  deltaValue: z.number().nullable(),
  rowMemberName: z.string(),
  rowUniqueName: z.string().optional(),
  variancePercentage: z.number().nullable(),
});

const cubeDimensionsResponseSchema = z.object({
  cubeName: z.string(),
  dimensions: z.array(cubeDimensionSchema),
  members: z.array(cubeSampleMemberSetSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const dimensionAccessibilityDiagnosticSchema = z.object({
  allLeavesHierarchyName: z.string().optional(),
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  kind: z.enum(["server", "cube", "dimension"]),
  classification: z.enum([
    "accessible",
    "authenticated_but_not_authorized",
    "server_not_reachable_by_endpoint",
    "unexpected_upstream_error",
  ]),
  cubeName: z.string(),
  dimensionName: z.string().optional(),
  hierarchy: tm1HierarchyMetadataSchema.optional(),
  hierarchyName: z.string().optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  members: z.array(tm1MemberSchema),
  message: z.string(),
  name: z.string(),
  reachable: z.boolean(),
  serverName: z.string(),
  statusCode: z.number().int().optional(),
  uniqueName: z.string().optional(),
});

const dimensionAccessibilityResponseSchema = z.object({
  cubeName: z.string(),
  dimensions: z.array(dimensionAccessibilityDiagnosticSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeDimensionStructureDiagnosticSchema = z.object({
  allLeavesHierarchyName: z.string().optional(),
  attributes: tm1AttributeMapSchema.optional(),
  caption: z.string().optional(),
  kind: z.enum(["server", "cube", "dimension"]),
  classification: z.enum([
    "accessible",
    "authenticated_but_not_authorized",
    "server_not_reachable_by_endpoint",
    "unexpected_upstream_error",
  ]),
  cubeName: z.string(),
  dimensionName: z.string().optional(),
  hierarchy: tm1HierarchyMetadataSchema.optional(),
  hierarchyName: z.string().optional(),
  localizedAttributes: tm1LocalizedAttributeMapSchema.optional(),
  message: z.string(),
  name: z.string(),
  reachable: z.boolean(),
  serverName: z.string(),
  statusCode: z.number().int().optional(),
  uniqueName: z.string().optional(),
});

const cubeDimensionStructureResponseSchema = z.object({
  cubeName: z.string(),
  dimensions: z.array(cubeDimensionStructureDiagnosticSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const dimensionDetailResponseSchema = z.object({
  cubeName: z.string(),
  dimension: dimensionAccessibilityDiagnosticSchema,
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeDataPreviewResponseSchema = z.object({
  cubeName: z.string(),
  filters: z.array(cubeDataPreviewFilterSchema),
  mode: z.enum(["live", "mock"]),
  rowDimensionName: z.string(),
  rows: z.array(cubeDataPreviewRowSchema),
  serverName: z.string(),
});

const cubeComparatorResponseSchema = z.object({
  baseMemberName: z.string(),
  compareMemberName: z.string(),
  comparisonDimensionName: z.string(),
  contextFilters: z.array(cubeComparatorFilterSchema),
  cubeName: z.string(),
  mode: z.enum(["live", "mock"]),
  rowDimensionName: z.string(),
  rows: z.array(cubeComparatorRowSchema),
  serverName: z.string(),
});

const routeErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export {
  cubeAccessibilityResponseSchema,
  cubeComparatorResponseSchema,
  cubeDataPreviewResponseSchema,
  cubeDimensionsResponseSchema,
  cubeDimensionStructureResponseSchema,
  cubesResponseSchema,
  dimensionAccessibilityResponseSchema,
  dimensionDetailResponseSchema,
  routeErrorSchema,
  serverAccessibilityResponseSchema,
};
