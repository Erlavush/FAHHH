import { getSharedBackendMode } from "./sharedBackendConfig";
import { createFirebaseRoomStore } from "./firebaseRoomStore";
import type { SharedRoomDocument } from "./sharedRoomTypes";
import type {
  BootstrapDevSharedRoomInput,
  CommitSharedRoomStateInput,
  CreateSharedRoomInput,
  JoinSharedRoomInput,
  LoadSharedRoomInput,
  SharedRoomStore
} from "./sharedRoomStore";
import { validateSharedRoomDocument } from "./sharedRoomValidation";

type SharedRoomFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export class SharedRoomClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SharedRoomClientError";
    this.status = status;
  }
}

export function isSharedRoomConflictError(
  error: unknown
): error is SharedRoomClientError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 409
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const bodyText = await response.text();
  return bodyText ? (JSON.parse(bodyText) as unknown) : null;
}

async function fetchSharedRoomDocument(
  fetchImpl: SharedRoomFetch,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SharedRoomDocument> {
  const response = await fetchImpl(input, init);
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const message =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
        : response.status === 409
          ? "Shared room revision conflict."
        : `Shared room request failed with status ${response.status}`;

    throw new SharedRoomClientError(message, response.status);
  }

  return validateSharedRoomDocument(responseBody);
}

export function createSharedRoomStore(fetchImpl: SharedRoomFetch = fetch): SharedRoomStore {
  return {
    bootstrapDevSharedRoom(input: BootstrapDevSharedRoomInput) {
      return fetchSharedRoomDocument(fetchImpl, "/api/dev/shared-room/dev-bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
    },
    createSharedRoom(input: CreateSharedRoomInput) {
      return fetchSharedRoomDocument(fetchImpl, "/api/dev/shared-room/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
    },
    joinSharedRoom(input: JoinSharedRoomInput) {
      return fetchSharedRoomDocument(fetchImpl, "/api/dev/shared-room/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
    },
    loadSharedRoom(input: LoadSharedRoomInput) {
      return fetchSharedRoomDocument(
        fetchImpl,
        `/api/dev/shared-room/room/${encodeURIComponent(input.roomId)}`
      );
    },
    commitSharedRoomState(input: CommitSharedRoomStateInput) {
      return fetchSharedRoomDocument(fetchImpl, "/api/dev/shared-room/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });
    }
  };
}

export const sharedRoomClient =
  getSharedBackendMode() === "firebase"
    ? createFirebaseRoomStore()
    : createSharedRoomStore();
