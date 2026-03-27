import {
  get,
  getDatabase,
  onDisconnect,
  ref,
  remove,
  runTransaction,
  set,
  type Database
} from "firebase/database";
import { getFirebaseApp } from "./firebaseApp";
import type { FirebaseHostedDatabase } from "./firebaseOwnershipStore";
import type { SharedPresenceStore } from "./sharedPresenceStore";
import type {
  AcquireSharedEditLockInput,
  LeavePairLinkPresenceInput,
  LeaveSharedPresenceInput,
  LoadPairLinkPresenceInput,
  LoadSharedRoomLocksInput,
  LoadSharedRoomPresenceInput,
  ReleaseSharedEditLockInput,
  RenewSharedEditLockInput,
  SharedEditLock,
  SharedEditLockRoomSnapshot,
  SharedPairLinkPresence,
  SharedPairLinkPresenceSnapshot,
  SharedPetLiveState,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot,
  UpsertPairLinkPresenceInput,
  UpsertSharedPresenceInput
} from "./sharedPresenceTypes";
import {
  validateSharedEditLock,
  validateSharedEditLockRoomSnapshot,
  validateSharedPairLinkPresence,
  validateSharedPairLinkPresenceSnapshot,
  validateSharedPetLiveState,
  validateSharedPresenceRoomSnapshot,
  validateSharedPresenceSnapshot
} from "./sharedPresenceValidation";

export interface FirebasePresenceStoreOptions {
  database?: FirebaseHostedDatabase;
  realtimeDatabase?: Database;
  now?: () => string;
}

class FirebasePresenceStoreError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FirebasePresenceStoreError";
    this.status = status;
  }
}

const LOCK_TTL_MS = 5000;

function createTimestamp(nowIso?: string | number | Date): string {
  if (!nowIso) {
    return new Date().toISOString();
  }

  if (typeof nowIso === "number") {
    return Number.isFinite(nowIso)
      ? new Date(nowIso).toISOString()
      : new Date().toISOString();
  }

  if (nowIso instanceof Date) {
    return new Date(nowIso.getTime()).toISOString();
  }

  const parsed = Date.parse(nowIso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function buildPresenceSnapshot(
  roomId: string,
  presenceMap: Record<string, SharedPresenceSnapshot>,
  sharedPetState: SharedPetLiveState | null,
  updatedAt: string
): SharedPresenceRoomSnapshot {
  return validateSharedPresenceRoomSnapshot({
    roomId,
    presences: Object.values(presenceMap),
    sharedPetState,
    updatedAt
  });
}

function buildLockSnapshot(
  roomId: string,
  lockMap: Record<string, SharedEditLock>,
  updatedAt: string
): SharedEditLockRoomSnapshot {
  return validateSharedEditLockRoomSnapshot({
    roomId,
    locks: Object.values(lockMap),
    updatedAt
  });
}

function buildPairLinkPresenceSnapshot(
  pendingLinkId: string,
  presenceMap: Record<string, SharedPairLinkPresence>,
  updatedAt: string
): SharedPairLinkPresenceSnapshot {
  return validateSharedPairLinkPresenceSnapshot({
    pendingLinkId,
    presences: Object.values(presenceMap),
    updatedAt
  });
}

function createEmptyPresenceSnapshot(roomId: string, updatedAt: string) {
  return buildPresenceSnapshot(roomId, {}, null, updatedAt);
}

function createEmptyLockSnapshot(roomId: string, updatedAt: string) {
  return buildLockSnapshot(roomId, {}, updatedAt);
}

function createEmptyPairLinkSnapshot(pendingLinkId: string, updatedAt: string) {
  return buildPairLinkPresenceSnapshot(pendingLinkId, {}, updatedAt);
}

function ensureMemoryRoomMembership(
  database: FirebaseHostedDatabase,
  roomId: string,
  playerId: string
) {
  const roomDocument = database.sharedRooms[roomId];

  if (!roomDocument) {
    throw new FirebasePresenceStoreError("Shared room not found.", 404);
  }

  if (!roomDocument.memberIds.includes(playerId)) {
    throw new FirebasePresenceStoreError("Player is not a member of this shared room", 403);
  }
}

function pruneExpiredMemoryLocks(
  lockMap: Record<string, SharedEditLock>,
  now = Date.now()
): Record<string, SharedEditLock> {
  return Object.fromEntries(
    Object.entries(lockMap).filter(([, lock]) => {
      const expiresAt = Date.parse(lock.expiresAt);
      return Number.isFinite(expiresAt) && expiresAt > now;
    })
  );
}

function normalizeRoomPresenceRecord(
  rawValue: Record<string, unknown> | null | undefined
): {
  presences: Record<string, SharedPresenceSnapshot>;
  sharedPetState: SharedPetLiveState | null;
} {
  if (!rawValue) {
    return {
      presences: {},
      sharedPetState: null
    };
  }

  if ("presences" in rawValue) {
    const rawPresences = rawValue.presences;
    const rawSharedPetState = "sharedPetState" in rawValue ? rawValue.sharedPetState : null;

    return {
      presences:
        rawPresences && typeof rawPresences === "object"
          ? Object.fromEntries(
              Object.entries(rawPresences).map(([playerId, presence]) => [
                playerId,
                validateSharedPresenceSnapshot(presence)
              ])
            )
          : {},
      sharedPetState:
        rawSharedPetState === null || rawSharedPetState === undefined
          ? null
          : validateSharedPetLiveState(rawSharedPetState)
    };
  }

  return {
    presences: Object.fromEntries(
      Object.entries(rawValue).map(([playerId, presence]) => [
        playerId,
        validateSharedPresenceSnapshot(presence)
      ])
    ),
    sharedPetState: null
  };
}

function createRoomPresenceRecord(
  presences: Record<string, SharedPresenceSnapshot>,
  sharedPetState: SharedPetLiveState | null
): Record<string, unknown> {
  return {
    presences,
    sharedPetState
  };
}

export function createFirebasePresenceStore(
  options: FirebasePresenceStoreOptions = {}
): SharedPresenceStore {
  const now = () => createTimestamp(options.now?.());

  if (options.database) {
    const database = options.database;

    return {
      async upsertPresence(input: UpsertSharedPresenceInput) {
        const presence = validateSharedPresenceSnapshot(input.presence);
        const updatedAt = now();

        ensureMemoryRoomMembership(database, presence.roomId, presence.playerId);
        const roomPresence = normalizeRoomPresenceRecord(
          database.roomPresence[presence.roomId] as Record<string, unknown> | undefined
        );
        const nextPresence = validateSharedPresenceSnapshot({
          ...presence,
          updatedAt
        });
        const sharedPetState =
          input.sharedPetState === undefined
            ? roomPresence.sharedPetState
            : input.sharedPetState === null
              ? null
              : validateSharedPetLiveState({
                  ...input.sharedPetState,
                  updatedAt
                });

        database.roomPresence[presence.roomId] = createRoomPresenceRecord(
          {
            ...roomPresence.presences,
            [presence.playerId]: nextPresence
          },
          sharedPetState
        );

        return nextPresence;
      },
      async loadRoomPresence(input: LoadSharedRoomPresenceInput) {
        ensureMemoryRoomMembership(
          database,
          input.roomId,
          database.sharedRooms[input.roomId]?.memberIds[0] ?? ""
        );
        const roomPresence = normalizeRoomPresenceRecord(
          database.roomPresence[input.roomId] as Record<string, unknown> | undefined
        );
        return buildPresenceSnapshot(
          input.roomId,
          roomPresence.presences,
          roomPresence.sharedPetState,
          now()
        );
      },
      async leavePresence(input: LeaveSharedPresenceInput) {
        const roomPresence = normalizeRoomPresenceRecord(
          database.roomPresence[input.roomId] as Record<string, unknown> | undefined
        );
        const nextRoomPresence = Object.fromEntries(
          Object.entries(roomPresence.presences).filter(
            ([playerId]) => playerId !== input.playerId
          )
        );

        database.roomPresence[input.roomId] = createRoomPresenceRecord(
          nextRoomPresence,
          roomPresence.sharedPetState
        );
        return buildPresenceSnapshot(
          input.roomId,
          nextRoomPresence,
          roomPresence.sharedPetState,
          now()
        );
      },
      async acquireEditLock(input: AcquireSharedEditLockInput) {
        ensureMemoryRoomMembership(database, input.roomId, input.playerId);
        const lockMap = pruneExpiredMemoryLocks(
          ((database.roomLocks[input.roomId] ?? {}) as Record<string, SharedEditLock>)
        );
        const existingLock = lockMap[input.furnitureId];

        if (existingLock && existingLock.playerId !== input.playerId) {
          throw new FirebasePresenceStoreError("Your partner is editing this item", 409);
        }

        lockMap[input.furnitureId] = validateSharedEditLock({
          roomId: input.roomId,
          furnitureId: input.furnitureId,
          playerId: input.playerId,
          displayName: input.displayName,
          expiresAt: createTimestamp(Date.now() + LOCK_TTL_MS),
          updatedAt: now()
        });
        database.roomLocks[input.roomId] = lockMap;

        return buildLockSnapshot(input.roomId, lockMap, now());
      },
      async loadRoomLocks(input: LoadSharedRoomLocksInput) {
        const lockMap = pruneExpiredMemoryLocks(
          ((database.roomLocks[input.roomId] ?? {}) as Record<string, SharedEditLock>)
        );
        database.roomLocks[input.roomId] = lockMap;
        return buildLockSnapshot(input.roomId, lockMap, now());
      },
      async releaseEditLock(input: ReleaseSharedEditLockInput) {
        const lockMap = pruneExpiredMemoryLocks(
          ((database.roomLocks[input.roomId] ?? {}) as Record<string, SharedEditLock>)
        );

        delete lockMap[input.furnitureId];
        database.roomLocks[input.roomId] = lockMap;
        return buildLockSnapshot(input.roomId, lockMap, now());
      },
      async renewEditLock(input: RenewSharedEditLockInput) {
        const lockMap = pruneExpiredMemoryLocks(
          ((database.roomLocks[input.roomId] ?? {}) as Record<string, SharedEditLock>)
        );
        const existingLock = lockMap[input.furnitureId];

        if (!existingLock || existingLock.playerId !== input.playerId) {
          throw new FirebasePresenceStoreError("Edit lock is no longer active", 410);
        }

        lockMap[input.furnitureId] = validateSharedEditLock({
          ...existingLock,
          displayName: input.displayName,
          expiresAt: createTimestamp(Date.now() + LOCK_TTL_MS),
          updatedAt: now()
        });
        database.roomLocks[input.roomId] = lockMap;
        return buildLockSnapshot(input.roomId, lockMap, now());
      },
      async upsertPairLinkPresence(input: UpsertPairLinkPresenceInput) {
        const pendingLinkPresence =
          (database.pairLinkPresence[input.pendingLinkId] ?? {}) as Record<
            string,
            SharedPairLinkPresence
          >;
        const nextPresence = validateSharedPairLinkPresence({
          pendingLinkId: input.pendingLinkId,
          playerId: input.playerId,
          displayName: input.displayName,
          updatedAt: now()
        });

        database.pairLinkPresence[input.pendingLinkId] = {
          ...pendingLinkPresence,
          [input.playerId]: nextPresence
        };

        return buildPairLinkPresenceSnapshot(
          input.pendingLinkId,
          database.pairLinkPresence[input.pendingLinkId] as Record<
            string,
            SharedPairLinkPresence
          >,
          now()
        );
      },
      async loadPairLinkPresence(input: LoadPairLinkPresenceInput) {
        const pendingLinkPresence =
          (database.pairLinkPresence[input.pendingLinkId] ?? {}) as Record<
            string,
            SharedPairLinkPresence
          >;
        return buildPairLinkPresenceSnapshot(input.pendingLinkId, pendingLinkPresence, now());
      },
      async leavePairLinkPresence(input: LeavePairLinkPresenceInput) {
        const pendingLinkPresence =
          (database.pairLinkPresence[input.pendingLinkId] ?? {}) as Record<
            string,
            SharedPairLinkPresence
          >;
        const nextPresence = Object.fromEntries(
          Object.entries(pendingLinkPresence).filter(
            ([playerId]) => playerId !== input.playerId
          )
        );

        database.pairLinkPresence[input.pendingLinkId] = nextPresence;
        return buildPairLinkPresenceSnapshot(input.pendingLinkId, nextPresence, now());
      }
    };
  }

  const realtimeDatabase = options.realtimeDatabase ?? getDatabase(getFirebaseApp());

  async function loadRoomPresenceSnapshot(
    roomId: string
  ): Promise<SharedPresenceRoomSnapshot> {
    const roomPresenceRef = ref(realtimeDatabase, `roomPresence/${roomId}`);
    const roomPresenceSnapshot = await get(roomPresenceRef);
    const roomPresenceRecord = normalizeRoomPresenceRecord(
      roomPresenceSnapshot.exists()
        ? (roomPresenceSnapshot.val() as Record<string, unknown>)
        : undefined
    );

    return buildPresenceSnapshot(
      roomId,
      roomPresenceRecord.presences,
      roomPresenceRecord.sharedPetState,
      now()
    );
  }

  async function loadLockSnapshot(roomId: string): Promise<SharedEditLockRoomSnapshot> {
    const roomLocksRef = ref(realtimeDatabase, `roomLocks/${roomId}`);
    const roomLocksSnapshot = await get(roomLocksRef);
    const rawLockMap = roomLocksSnapshot.exists()
      ? (roomLocksSnapshot.val() as Record<string, SharedEditLock>)
      : {};
    const lockMap = pruneExpiredMemoryLocks(rawLockMap);

    for (const [furnitureId, lock] of Object.entries(rawLockMap)) {
      if (!(furnitureId in lockMap)) {
        await remove(ref(realtimeDatabase, `roomLocks/${roomId}/${lock.furnitureId}`));
      }
    }

    return buildLockSnapshot(roomId, lockMap, now());
  }

  async function loadPairLinkSnapshot(
    pendingLinkId: string
  ): Promise<SharedPairLinkPresenceSnapshot> {
    const pairLinkPresenceRef = ref(
      realtimeDatabase,
      `pairLinkPresence/${pendingLinkId}`
    );
    const pairLinkSnapshot = await get(pairLinkPresenceRef);
    const presenceMap = pairLinkSnapshot.exists()
      ? (pairLinkSnapshot.val() as Record<string, SharedPairLinkPresence>)
      : {};

    return buildPairLinkPresenceSnapshot(pendingLinkId, presenceMap, now());
  }

  return {
    async upsertPresence(input: UpsertSharedPresenceInput) {
      const presence = validateSharedPresenceSnapshot(input.presence);
      const presenceRef = ref(realtimeDatabase, `roomPresence/${presence.roomId}/presences`);
      const nextPresence = validateSharedPresenceSnapshot({
        ...presence,
        updatedAt: now()
      });
      const sharedPetState =
        input.sharedPetState === undefined
          ? undefined
          : input.sharedPetState === null
            ? null
            : validateSharedPetLiveState({
                ...input.sharedPetState,
                updatedAt: now()
              });

      await runTransaction(presenceRef, (currentValue) => {
        const presenceMap =
          currentValue && typeof currentValue === "object"
            ? (currentValue as Record<string, SharedPresenceSnapshot>)
            : {};
        return {
          ...presenceMap,
          [presence.playerId]: nextPresence
        };
      });
      void onDisconnect(ref(realtimeDatabase, `roomPresence/${presence.roomId}/presences/${presence.playerId}`)).remove();

      if (sharedPetState !== undefined) {
        await set(
          ref(realtimeDatabase, `roomPresence/${presence.roomId}/sharedPetState`),
          sharedPetState
        );
      }

      return nextPresence;
    },
    loadRoomPresence(input: LoadSharedRoomPresenceInput) {
      return loadRoomPresenceSnapshot(input.roomId);
    },
    async leavePresence(input: LeaveSharedPresenceInput) {
      await remove(
        ref(realtimeDatabase, `roomPresence/${input.roomId}/presences/${input.playerId}`)
      );
      return loadRoomPresenceSnapshot(input.roomId);
    },
    async acquireEditLock(input: AcquireSharedEditLockInput) {
      const lockRef = ref(
        realtimeDatabase,
        `roomLocks/${input.roomId}/${input.furnitureId}`
      );
      let conflict = false;

      await runTransaction(lockRef, (currentValue) => {
        const currentLock = currentValue
          ? validateSharedEditLock(currentValue)
          : null;
        const expiresAt = currentLock ? Date.parse(currentLock.expiresAt) : Number.NaN;

        if (
          currentLock &&
          Number.isFinite(expiresAt) &&
          expiresAt > Date.now() &&
          currentLock.playerId !== input.playerId
        ) {
          conflict = true;
          return;
        }

        return validateSharedEditLock({
          roomId: input.roomId,
          furnitureId: input.furnitureId,
          playerId: input.playerId,
          displayName: input.displayName,
          expiresAt: createTimestamp(Date.now() + LOCK_TTL_MS),
          updatedAt: now()
        });
      });

      if (conflict) {
        throw new FirebasePresenceStoreError("Your partner is editing this item", 409);
      }

      return loadLockSnapshot(input.roomId);
    },
    loadRoomLocks(input: LoadSharedRoomLocksInput) {
      return loadLockSnapshot(input.roomId);
    },
    async releaseEditLock(input: ReleaseSharedEditLockInput) {
      await remove(
        ref(realtimeDatabase, `roomLocks/${input.roomId}/${input.furnitureId}`)
      );
      return loadLockSnapshot(input.roomId);
    },
    async renewEditLock(input: RenewSharedEditLockInput) {
      const lockRef = ref(
        realtimeDatabase,
        `roomLocks/${input.roomId}/${input.furnitureId}`
      );
      let missing = false;

      await runTransaction(lockRef, (currentValue) => {
        if (!currentValue) {
          missing = true;
          return;
        }

        const currentLock = validateSharedEditLock(currentValue);
        const expiresAt = Date.parse(currentLock.expiresAt);

        if (
          !Number.isFinite(expiresAt) ||
          expiresAt <= Date.now() ||
          currentLock.playerId !== input.playerId
        ) {
          missing = true;
          return;
        }

        return validateSharedEditLock({
          ...currentLock,
          displayName: input.displayName,
          expiresAt: createTimestamp(Date.now() + LOCK_TTL_MS),
          updatedAt: now()
        });
      });

      if (missing) {
        throw new FirebasePresenceStoreError("Edit lock is no longer active", 410);
      }

      return loadLockSnapshot(input.roomId);
    },
    async upsertPairLinkPresence(input: UpsertPairLinkPresenceInput) {
      const pairLinkPresenceRef = ref(
        realtimeDatabase,
        `pairLinkPresence/${input.pendingLinkId}/${input.playerId}`
      );
      const nextPresence = validateSharedPairLinkPresence({
        pendingLinkId: input.pendingLinkId,
        playerId: input.playerId,
        displayName: input.displayName,
        updatedAt: now()
      });

      await set(pairLinkPresenceRef, nextPresence);
      void onDisconnect(pairLinkPresenceRef).remove();

      return loadPairLinkSnapshot(input.pendingLinkId);
    },
    loadPairLinkPresence(input: LoadPairLinkPresenceInput) {
      return loadPairLinkSnapshot(input.pendingLinkId);
    },
    async leavePairLinkPresence(input: LeavePairLinkPresenceInput) {
      await remove(
        ref(
          realtimeDatabase,
          `pairLinkPresence/${input.pendingLinkId}/${input.playerId}`
        )
      );
      return loadPairLinkSnapshot(input.pendingLinkId);
    }
  };
}
