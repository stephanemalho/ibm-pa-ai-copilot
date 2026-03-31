import "server-only";

import { isIbmPaError } from "@/server/ibm-pa/errors";
import type { IbmPaLogContext } from "@/server/ibm-pa/types";

const logIbmPaInfo = (message: string, context?: IbmPaLogContext): void => {
  console.info("[ibm-pa]", message, sanitizeLogContext(context));
};

const logIbmPaWarn = (message: string, context?: IbmPaLogContext): void => {
  console.warn("[ibm-pa]", message, sanitizeLogContext(context));
};

const logIbmPaError = (
  message: string,
  error: unknown,
  context?: IbmPaLogContext,
): void => {
  console.error("[ibm-pa]", message, {
    ...sanitizeLogContext(context),
    ...serializeError(error),
  });
};

const sanitizeLogContext = (
  context?: IbmPaLogContext,
): IbmPaLogContext | undefined => {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("cookie")
      ) {
        return [key, "[redacted]"];
      }

      return [key, value];
    }),
  );
};

const serializeError = (error: unknown): IbmPaLogContext => {
  if (isIbmPaError(error)) {
    return {
      code: error.code,
      errorMessage: error.message,
      errorName: error.name,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
    };
  }

  return {
    errorMessage: "Unknown error",
    errorName: "UnknownError",
  };
};

export { logIbmPaError, logIbmPaInfo, logIbmPaWarn };
