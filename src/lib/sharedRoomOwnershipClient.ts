import { getSharedBackendMode } from "./sharedBackendConfig";
import { createFirebaseOwnershipStore } from "./firebaseOwnershipStore";
import type { SharedRoomOwnershipStore } from "./sharedRoomOwnershipStore";

export const sharedRoomOwnershipClient: SharedRoomOwnershipStore | null =
  getSharedBackendMode() === "firebase" ? createFirebaseOwnershipStore() : null;
