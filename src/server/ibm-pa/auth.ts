import "server-only";

import { IbmPaAuthenticationError } from "@/server/ibm-pa/errors";
import { getRequiredIbmPaEnv } from "@/server/ibm-pa/env";
import { logIbmPaWarn } from "@/server/ibm-pa/logger";
import type { IbmPaSession } from "@/server/ibm-pa/types";

const IBM_PA_AUTH_PATH = "rolemgmt/v1/users/me";

const authenticateIbmPa = async (): Promise<IbmPaSession> => {
  const liveEnv = getRequiredIbmPaEnv();
  const loginUrl = `${trimTrailingSlash(liveEnv.IBM_PA_BASE_URL)}/api/${encodeURIComponent(liveEnv.IBM_PA_TENANT_ID)}/v0/${IBM_PA_AUTH_PATH}`;

  const response = await fetch(loginUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`apikey:${liveEnv.IBM_PA_API_KEY}`).toString("base64")}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new IbmPaAuthenticationError(
      "IBM Planning Analytics authentication failed.",
      response.status === 401 || response.status === 403
        ? 502
        : response.status,
      {
        path: IBM_PA_AUTH_PATH,
        statusCode: response.status,
      },
    );
  }

  const cookieHeader = getCookieHeader(response);

  if (!cookieHeader) {
    logIbmPaWarn(
      "IBM PA authentication response did not include a reusable session cookie.",
      {
        path: IBM_PA_AUTH_PATH,
      },
    );

    throw new IbmPaAuthenticationError(
      "IBM Planning Analytics authentication succeeded without returning a session cookie.",
      502,
      {
        path: IBM_PA_AUTH_PATH,
      },
    );
  }

  return {
    authenticatedAt: new Date().toISOString(),
    cookieHeader,
  };
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

const trimTrailingSlash = (value: string): string => {
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export { authenticateIbmPa };
