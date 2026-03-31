import "server-only";

import type { IbmPaLogContext } from "@/server/ibm-pa/types";

type IbmPaErrorCode =
  | "IBM_PA_AUTHENTICATION_ERROR"
  | "IBM_PA_CONFIGURATION_ERROR"
  | "IBM_PA_REQUEST_ERROR"
  | "IBM_PA_RESPONSE_PARSE_ERROR";

class IbmPaError extends Error {
  public readonly code: IbmPaErrorCode;
  public readonly details: IbmPaLogContext | undefined;
  public readonly statusCode: number;

  public constructor(
    code: IbmPaErrorCode,
    message: string,
    statusCode: number,
    details?: IbmPaLogContext,
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "IbmPaError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class IbmPaConfigurationError extends IbmPaError {
  public constructor(message: string, details?: IbmPaLogContext) {
    super("IBM_PA_CONFIGURATION_ERROR", message, 503, details);
    this.name = "IbmPaConfigurationError";
  }
}

class IbmPaAuthenticationError extends IbmPaError {
  public constructor(
    message: string,
    statusCode = 502,
    details?: IbmPaLogContext,
    cause?: unknown,
  ) {
    super("IBM_PA_AUTHENTICATION_ERROR", message, statusCode, details, cause);
    this.name = "IbmPaAuthenticationError";
  }
}

class IbmPaRequestError extends IbmPaError {
  public constructor(
    message: string,
    statusCode = 502,
    details?: IbmPaLogContext,
    cause?: unknown,
  ) {
    super("IBM_PA_REQUEST_ERROR", message, statusCode, details, cause);
    this.name = "IbmPaRequestError";
  }
}

class IbmPaResponseParseError extends IbmPaError {
  public constructor(
    message: string,
    details?: IbmPaLogContext,
    cause?: unknown,
  ) {
    super("IBM_PA_RESPONSE_PARSE_ERROR", message, 502, details, cause);
    this.name = "IbmPaResponseParseError";
  }
}

const isIbmPaError = (error: unknown): error is IbmPaError => {
  return error instanceof IbmPaError;
};

const getIbmPaErrorResponse = (
  error: unknown,
): {
  body: { error: { code: string; message: string } };
  status: number;
} => {
  if (isIbmPaError(error)) {
    return {
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      status: error.statusCode,
    };
  }

  return {
    body: {
      error: {
        code: "IBM_PA_UNKNOWN_ERROR",
        message: "An unexpected IBM Planning Analytics error occurred.",
      },
    },
    status: 500,
  };
};

export {
  IbmPaAuthenticationError,
  IbmPaConfigurationError,
  IbmPaError,
  IbmPaRequestError,
  IbmPaResponseParseError,
  getIbmPaErrorResponse,
  isIbmPaError,
};
export type { IbmPaErrorCode };
