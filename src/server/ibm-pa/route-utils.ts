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

const createIbmPaErrorPayload = (
  error: unknown,
): {
  body: { error: { code: string; message: string } };
  status: number;
} => {
  logIbmPaError("IBM PA route failed.", error);

  return getIbmPaErrorResponse(error);
};

export { createIbmPaErrorPayload, parseCubesQuery, parseDimensionsQuery };
