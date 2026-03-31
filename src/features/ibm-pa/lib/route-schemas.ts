import { z } from "zod";

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
  name: z.string(),
  serverName: z.string(),
});

const cubesResponseSchema = z.object({
  cubes: z.array(cubeSummarySchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeAccessibilityDiagnosticSchema = z.object({
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
  serverName: z.string(),
  statusCode: z.number().int().optional(),
});

const cubeAccessibilityResponseSchema = z.object({
  cubes: z.array(cubeAccessibilityDiagnosticSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const cubeDimensionSchema = z.object({
  cubeName: z.string(),
  dimensionName: z.string(),
  hierarchyName: z.string().optional(),
  serverName: z.string(),
});

const cubeSampleMemberSetSchema = z.object({
  cubeName: z.string(),
  dimensionName: z.string(),
  hierarchyName: z.string(),
  members: z.array(z.string()),
  serverName: z.string(),
});

const cubeDimensionsResponseSchema = z.object({
  cubeName: z.string(),
  dimensions: z.array(cubeDimensionSchema),
  members: z.array(cubeSampleMemberSetSchema),
  mode: z.enum(["live", "mock"]),
  serverName: z.string(),
});

const dimensionAccessibilityDiagnosticSchema = z.object({
  kind: z.enum(["server", "cube", "dimension"]),
  classification: z.enum([
    "accessible",
    "authenticated_but_not_authorized",
    "server_not_reachable_by_endpoint",
    "unexpected_upstream_error",
  ]),
  cubeName: z.string(),
  hierarchyName: z.string().optional(),
  members: z.array(z.string()),
  message: z.string(),
  name: z.string(),
  reachable: z.boolean(),
  serverName: z.string(),
  statusCode: z.number().int().optional(),
});

const dimensionAccessibilityResponseSchema = z.object({
  cubeName: z.string(),
  dimensions: z.array(dimensionAccessibilityDiagnosticSchema),
  mode: z.enum(["live", "mock"]),
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
  cubeDimensionsResponseSchema,
  cubesResponseSchema,
  dimensionAccessibilityResponseSchema,
  routeErrorSchema,
  serverAccessibilityResponseSchema,
};
