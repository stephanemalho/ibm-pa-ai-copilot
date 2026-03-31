import "server-only";

import { IbmPaAuthenticationError } from "@/server/ibm-pa/errors";
import { getRequiredIbmPaEnv } from "@/server/ibm-pa/env";
import {
  logIbmPaError,
  logIbmPaInfo,
  logIbmPaWarn,
} from "@/server/ibm-pa/logger";
import type { IbmPaSession } from "@/server/ibm-pa/types";

const IBM_PA_AUTH_PATH = "rolemgmt/v1/users/me";

const authenticateIbmPa = async (): Promise<IbmPaSession> => {
  const liveEnv = getRequiredIbmPaEnv();
  const loginUrl = `${trimTrailingSlash(liveEnv.IBM_PA_BASE_URL)}/api/${encodeURIComponent(liveEnv.IBM_PA_TENANT_ID)}/v0/${IBM_PA_AUTH_PATH}`;
  const authorizationHeader = buildIbmPaBasicAuthorizationHeader(
    liveEnv.IBM_PA_API_KEY,
  );

  logIbmPaInfo("Authenticating against IBM PA.", {
    hasApiKey: Boolean(liveEnv.IBM_PA_API_KEY),
    hasBaseUrl: Boolean(liveEnv.IBM_PA_BASE_URL),
    hasTenantId: Boolean(liveEnv.IBM_PA_TENANT_ID),
    loginUrl,
  });

  let response: Response;

  try {
    response = await fetch(loginUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authorizationHeader,
      },
      method: "GET",
    });
  } catch (error) {
    logIbmPaError("IBM PA authentication request failed.", error, {
      loginUrl,
    });

    throw new IbmPaAuthenticationError(
      "IBM Planning Analytics authentication request failed.",
      502,
      {
        loginUrl,
      },
      error,
    );
  }

  logIbmPaInfo("IBM PA authentication response received.", {
    loginUrl,
    receivedSessionCookie: hasSessionCookie(response),
    statusCode: response.status,
  });

  if (!response.ok) {
    const responseBodyPreview = await response.text();

    logIbmPaWarn(
      "IBM PA authentication was rejected by the upstream service.",
      {
        loginUrl,
        responseBodyPreview: responseBodyPreview.slice(0, 500),
        statusCode: response.status,
      },
    );

    throw new IbmPaAuthenticationError(
      "IBM Planning Analytics authentication failed.",
      response.status === 401 || response.status === 403
        ? 502
        : response.status,
      {
        loginUrl,
        path: IBM_PA_AUTH_PATH,
        responseBodyPreview: responseBodyPreview.slice(0, 500),
        statusCode: response.status,
      },
    );
  }

  const cookieHeader = getCookieHeader(response);

  if (!cookieHeader) {
    logIbmPaWarn(
      "IBM PA authentication response did not include a reusable session cookie.",
      {
        loginUrl,
        path: IBM_PA_AUTH_PATH,
      },
    );

    throw new IbmPaAuthenticationError(
      "IBM Planning Analytics authentication succeeded without returning a session cookie.",
      502,
      {
        loginUrl,
        path: IBM_PA_AUTH_PATH,
      },
    );
  }

  return {
    authenticatedAt: new Date().toISOString(),
    cookieHeader,
  };
};

const buildIbmPaBasicAuthorizationHeader = (apiKey: string): string => {
  const encodedCredentials = Buffer.from(`apikey:${apiKey}`).toString("base64");

  return `Basic ${encodedCredentials}`;
};

const getCookieHeader = (response: Response): string | null => {
  const setCookieValues =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  if (setCookieValues.length > 0) {
    return setCookieValues.map((value) => value.split(";", 1)[0]).join("; ");
  }

  const singleSetCookie = response.headers.get("set-cookie");

  if (!singleSetCookie) {
    return null;
  }

  return singleSetCookie.split(";", 1)[0] ?? null;
};

const hasSessionCookie = (response: Response): boolean => {
  return getCookieHeader(response) !== null;
};

const trimTrailingSlash = (value: string): string => {
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export { authenticateIbmPa, buildIbmPaBasicAuthorizationHeader };
