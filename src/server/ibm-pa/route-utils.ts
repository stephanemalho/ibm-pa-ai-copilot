import "server-only";

import { z } from "zod";

import { getIbmPaErrorResponse } from "@/server/ibm-pa/errors";
import { logIbmPaError } from "@/server/ibm-pa/logger";

const cubesQuerySchema = z.object({
  server: z.string().trim().min(1).optional(),
});

const dimensionsQuerySchema = z.object({
  cube: z.string().trim().min(1),
  sampleSize: z.coerce.number().int().min(1).max(25).optional(),
  server: z.string().trim().min(1).optional(),
});

const dimensionDetailQuerySchema = z.object({
  cube: z.string().trim().min(1),
  dimension: z.string().trim().min(1),
  sampleSize: z.coerce.number().int().min(1).max(25).optional(),
  server: z.string().trim().min(1),
});

const logsQuerySchema = z.object({
  level: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  minutes: z.coerce.number().int().min(1).max(1440).default(60),
  server: z.string().trim().min(1).optional(),
});

const mappingQuerySchema = z.object({
  includeProcesses: z
    .enum(["false", "true"])
    .optional()
    .transform((value) => {
      return value === undefined ? true : value === "true";
    }),
  maxCubes: z.coerce.number().int().min(1).max(75).default(25),
  server: z.string().trim().min(1).optional(),
});

const parseCubesQuery = (
  searchParams: URLSearchParams,
): z.infer<typeof cubesQuerySchema> => {
  return cubesQuerySchema.parse(Object.fromEntries(searchParams.entries()));
};

const parseDimensionsQuery = (
  searchParams: URLSearchParams,
): z.infer<typeof dimensionsQuerySchema> => {
  return dimensionsQuerySchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
};

const parseDimensionDetailQuery = (
  searchParams: URLSearchParams,
): z.infer<typeof dimensionDetailQuerySchema> => {
  return dimensionDetailQuerySchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
};

const parseLogsQuery = (
  searchParams: URLSearchParams,
): z.infer<typeof logsQuerySchema> => {
  return logsQuerySchema.parse(Object.fromEntries(searchParams.entries()));
};

const parseMappingQuery = (
  searchParams: URLSearchParams,
): z.infer<typeof mappingQuerySchema> => {
  return mappingQuerySchema.parse(Object.fromEntries(searchParams.entries()));
};

const createIbmPaErrorPayload = (
  error: unknown,
): {
  body: { error: { code: string; message: string } };
  status: number;
} => {
  logIbmPaError("IBM PA route failed.", error);

  return getIbmPaErrorResponse(error);
};

export {
  createIbmPaErrorPayload,
  parseCubesQuery,
  parseDimensionDetailQuery,
  parseDimensionsQuery,
  parseLogsQuery,
  parseMappingQuery,
};
