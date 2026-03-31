import "server-only";

import type { IbmPaSession } from "@/server/ibm-pa/types";

let ibmPaSession: IbmPaSession | null = null;
let pendingSessionPromise: Promise<IbmPaSession> | null = null;

const getStoredIbmPaSession = (): IbmPaSession | null => {
  return ibmPaSession;
};

const clearStoredIbmPaSession = (): void => {
  ibmPaSession = null;
};

const getOrCreateStoredIbmPaSession = async (
  createSession: () => Promise<IbmPaSession>,
): Promise<IbmPaSession> => {
  if (ibmPaSession) {
    return ibmPaSession;
  }

  if (pendingSessionPromise) {
    return pendingSessionPromise;
  }

  pendingSessionPromise = createSession()
    .then((session) => {
      ibmPaSession = session;

      return session;
    })
    .finally(() => {
      pendingSessionPromise = null;
    });

  return pendingSessionPromise;
};

export {
  clearStoredIbmPaSession,
  getOrCreateStoredIbmPaSession,
  getStoredIbmPaSession,
};
