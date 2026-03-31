import "server-only";

import { z } from "zod";

import { authenticateIbmPa } from "@/server/ibm-pa/auth";
import {
  IbmPaRequestError,
  IbmPaResponseParseError,
} from "@/server/ibm-pa/errors";
import { getRequiredIbmPaEnv } from "@/server/ibm-pa/env";
import { logIbmPaError } from "@/server/ibm-pa/logger";
import {
  clearStoredIbmPaSession,
  getOrCreateStoredIbmPaSession,
} from "@/server/ibm-pa/session-store";
import type { IbmPaRequestOptions } from "@/server/ibm-pa/types";

const jsonBodySchema = z.union([
  z.array(z.unknown()),
  z.boolean(),
  z.null(),
  z.number(),
  z.object({}).passthrough(),
  z.string(),
]);

const requestIbmPaJson = async (
  options: IbmPaRequestOptions,
): Promise<unknown> => {
  const response = await executeWithSession(options);
  const text = await response.text();

  if (!text) {
    return null;
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch (error) {
    throw new IbmPaResponseParseError(
      "IBM Planning Analytics returned a non-JSON response.",
      {
        path: options.path,
      },
      error,
    );
  }

  const jsonBody = jsonBodySchema.safeParse(parsedJson);

  if (!jsonBody.success) {
    throw new IbmPaResponseParseError(
      "IBM Planning Analytics returned an unsupported JSON payload.",
      {
        path: options.path,
      },
      jsonBody.error,
    );
  }

  return jsonBody.data;
};

const executeWithSession = async (
  options: IbmPaRequestOptions,
): Promise<Response> => {
  const firstSession = await getOrCreateStoredIbmPaSession(authenticateIbmPa);
  let response = await executeRequest(options, firstSession.cookieHeader);

  if (response.status !== 401) {
    return assertOkResponse(response, options.path);
  }

  clearStoredIbmPaSession();

  const refreshedSession =
    await getOrCreateStoredIbmPaSession(authenticateIbmPa);
  response = await executeRequest(options, refreshedSession.cookieHeader);

  return assertOkResponse(response, options.path);
};

const executeRequest = async (
  options: IbmPaRequestOptions,
  cookieHeader: string,
): Promise<Response> => {
  const url = buildIbmPaRequestUrl(options);
  const requestInit: RequestInit = {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      Cookie: cookieHeader,
    },
    method: options.method ?? "GET",
    signal: AbortSignal.timeout(15000),
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  try {
    return await fetch(url, requestInit);
  } catch (error) {
    logIbmPaError("IBM PA network request failed.", error, {
      path: options.path,
      url,
    });

    throw new IbmPaRequestError(
      "IBM Planning Analytics request failed before a response was received.",
      502,
      {
        path: options.path,
      },
      error,
    );
  }
};

const assertOkResponse = async (
  response: Response,
  path: string,
): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const responseText = await response.text();

  throw new IbmPaRequestError(
    "IBM Planning Analytics request failed.",
    response.status,
    {
      path,
      responseText: responseText.slice(0, 500),
      statusCode: response.status,
    },
  );
};

const buildIbmPaRequestUrl = (options: IbmPaRequestOptions): string => {
  const liveEnv = getRequiredIbmPaEnv();
  const tenantRoot = `${trimTrailingSlash(liveEnv.IBM_PA_BASE_URL)}/api/${encodeURIComponent(liveEnv.IBM_PA_TENANT_ID)}/v0`;

  if (options.scope.kind === "tenant") {
    return `${tenantRoot}${normalizeRelativePath(options.path)}`;
  }

  return `${tenantRoot}/tm1/${encodeURIComponent(options.scope.serverName)}/api/v1${normalizeRelativePath(options.path)}`;
};

const normalizeRelativePath = (path: string): string => {
  return path.startsWith("/") ? path : `/${path}`;
};

const trimTrailingSlash = (value: string): string => {
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export { requestIbmPaJson };
