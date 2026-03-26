import type {
  AcquireSharedEditLockInput,
  LeaveSharedPresenceInput,
  LoadSharedRoomLocksInput,
  LoadSharedRoomPresenceInput,
  ReleaseSharedEditLockInput,
  RenewSharedEditLockInput,
  SharedEditLockRoomSnapshot,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot,
  UpsertSharedPresenceInput
} from "./sharedPresenceTypes";
import type { SharedPresenceStore } from "./sharedPresenceStore";
import {
  validateSharedEditLockRoomSnapshot,
  validateSharedPresenceRoomSnapshot,
  validateSharedPresenceSnapshot
} from "./sharedPresenceValidation";

type SharedPresenceFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class SharedPresenceClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SharedPresenceClientError";
    this.status = status;
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const bodyText = await response.text();
  return bodyText ? (JSON.parse(bodyText) as unknown) : null;
}

async function fetchValidatedResponse<T>(
  fetchImpl: SharedPresenceFetch,
  input: RequestInfo | URL,
  validate: (value: unknown) => T,
  init?: RequestInit
): Promise<T> {
  const response = await fetchImpl(input, init);
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
        : `Shared presence request failed with status ${response.status}`;

    throw new SharedPresenceClientError(message, response.status);
  }

  return validate(responseBody);
}

export function createSharedPresenceStore(
  fetchImpl: SharedPresenceFetch = fetch
): SharedPresenceStore {
  return {
    acquireEditLock(
      input: AcquireSharedEditLockInput
    ): Promise<SharedEditLockRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        "/api/dev/shared-room/locks/acquire",
        validateSharedEditLockRoomSnapshot,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      );
    },
    loadRoomLocks(
      input: LoadSharedRoomLocksInput
    ): Promise<SharedEditLockRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        `/api/dev/shared-room/locks/room/${encodeURIComponent(input.roomId)}`,
        validateSharedEditLockRoomSnapshot
      );
    },
    upsertPresence(input: UpsertSharedPresenceInput): Promise<SharedPresenceSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        "/api/dev/shared-room/presence/upsert",
        validateSharedPresenceSnapshot,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      );
    },
    loadRoomPresence(
      input: LoadSharedRoomPresenceInput
    ): Promise<SharedPresenceRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        `/api/dev/shared-room/presence/room/${encodeURIComponent(input.roomId)}`,
        validateSharedPresenceRoomSnapshot
      );
    },
    leavePresence(input: LeaveSharedPresenceInput): Promise<SharedPresenceRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        "/api/dev/shared-room/presence/leave",
        validateSharedPresenceRoomSnapshot,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      );
    },
    releaseEditLock(
      input: ReleaseSharedEditLockInput
    ): Promise<SharedEditLockRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        "/api/dev/shared-room/locks/release",
        validateSharedEditLockRoomSnapshot,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      );
    },
    renewEditLock(
      input: RenewSharedEditLockInput
    ): Promise<SharedEditLockRoomSnapshot> {
      return fetchValidatedResponse(
        fetchImpl,
        "/api/dev/shared-room/locks/renew",
        validateSharedEditLockRoomSnapshot,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      );
    }
  };
}

export const sharedPresenceClient = createSharedPresenceStore();
