import { mkdir, readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSharedRoomSeed } from "../src/lib/sharedRoomSeed";
import {
  advanceRitualDayIfNeeded,
  createInitialSharedRoomProgression
} from "../src/lib/sharedProgression";
import {
  isValidSharedPlayerProfile,
  validateSharedRoomDocument
} from "../src/lib/sharedRoomValidation";
import {
  validateSharedEditLock,
  validateSharedEditLockRoomSnapshot,
  validateSharedPresenceRoomSnapshot,
  validateSharedPresenceSnapshot
} from "../src/lib/sharedPresenceValidation";

export const SHARED_ROOM_DEV_DB_FILENAME = "shared-room-dev-db.json";
export const DEV_SHARED_ROOM_ID = "dev-shared-room";
export const DEV_SHARED_ROOM_INVITE_CODE = "DEVROOM";
export const SHARED_EDIT_LOCK_TTL_MS = 5000;
export const SHARED_PRESENCE_TTL_MS = 10000;

// Simple lock to prevent concurrent database writes from corrupting the file
// Singleton in-memory database to prevent race conditions between requests
let inMemoryDatabase = null;
let dbWritePromise = Promise.resolve();

async function queuedWriteDatabase(databasePath, database) {
  // Deep clone to ensure the version we persist doesn't change mid-write
  const databaseSnapshot = JSON.parse(JSON.stringify(database));

  const nextWrite = dbWritePromise.then(() => {
    const parentDir = path.dirname(databasePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const content = JSON.stringify(databaseSnapshot, null, 2);
    const tempPath = `${databasePath}.tmp`;
    fs.writeFileSync(tempPath, content, "utf8");
    fs.renameSync(tempPath, databasePath);
  });
  dbWritePromise = nextWrite.catch(() => {});
  return nextWrite;
}

export async function loadSharedRoomDevDatabase(databasePath) {
  if (inMemoryDatabase) {
    return inMemoryDatabase;
  }

  if (!fs.existsSync(databasePath)) {
    inMemoryDatabase = {
      profiles: {},
      invites: {},
      rooms: {},
      presenceByRoom: {},
      locksByRoom: {}
    };
    return inMemoryDatabase;
  }

  const content = fs.readFileSync(databasePath, "utf8");
  try {
    inMemoryDatabase = JSON.parse(content);
  } catch (err) {
    console.error("DB corruption detected, resetting:", err);
    inMemoryDatabase = {
      profiles: {},
      invites: {},
      rooms: {},
      presenceByRoom: {},
      locksByRoom: {}
    };
  }
  return inMemoryDatabase;
}
class SharedRoomHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SharedRoomHttpError";
    this.status = status;
  }
}

export function createEmptySharedRoomDevDatabase() {
  return {
    profiles: {},
    invites: {},
    rooms: {},
    presenceByRoom: {},
    locksByRoom: {}
  };
}

function normalizeInviteCode(code) {
  if (typeof code !== "string") {
    throw new SharedRoomHttpError("Invite code is required", 400);
  }

  return code.trim().toUpperCase();
}

export function createInviteCode() {
  return randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

function createTimestamp(timestampMs = Date.now()) {
  return new Date(timestampMs).toISOString();
}

function ensureValidProfile(profile) {
  if (!isValidSharedPlayerProfile(profile)) {
    throw new SharedRoomHttpError("Invalid shared player profile", 400);
  }

  return profile;
}

function createSharedRoomMember(profile, role, joinedAt) {
  return {
    playerId: profile.playerId,
    displayName: profile.displayName,
    role,
    joinedAt
  };
}

function serializeJson(value) {
  return JSON.stringify(value);
}

function normalizeStoredSharedRoomDocument(roomDocument, nowIso = createTimestamp()) {
  const validatedRoomDocument = validateSharedRoomDocument(roomDocument);
  const nextProgression = advanceRitualDayIfNeeded(
    validatedRoomDocument.progression,
    validatedRoomDocument.memberIds,
    validatedRoomDocument.members,
    nowIso
  );
  const normalizedRoomDocument = validateSharedRoomDocument({
    ...validatedRoomDocument,
    updatedAt:
      serializeJson(validatedRoomDocument.progression) === serializeJson(nextProgression) &&
      !("sharedCoins" in roomDocument)
        ? validatedRoomDocument.updatedAt
        : nowIso,
    progression: nextProgression
  });

  return normalizedRoomDocument;
}

export async function writeSharedRoomDevDatabase(databasePath, database) {
  await queuedWriteDatabase(databasePath, database);
}

function upsertProfileInDatabase(database, profile) {
  const validatedProfile = ensureValidProfile(profile);
  const existingProfile = database.profiles[validatedProfile.playerId];

  database.profiles[validatedProfile.playerId] = existingProfile
    ? {
        ...existingProfile,
        displayName: validatedProfile.displayName,
        updatedAt: createTimestamp()
      }
    : {
        ...validatedProfile
      };

  return database.profiles[validatedProfile.playerId];
}

export function createSharedRoomInDatabase(database, input) {
  const profile = upsertProfileInDatabase(database, input?.profile);
  const timestamp = createTimestamp();
  const roomId = `shared-room-${randomUUID()}`;
  const inviteCode = createInviteCode();
  const roomDocument = validateSharedRoomDocument({
    roomId,
    inviteCode,
    memberIds: [profile.playerId],
    members: [createSharedRoomMember(profile, "creator", timestamp)],
    revision: 1,
    progression: createInitialSharedRoomProgression(
      [profile.playerId],
      [createSharedRoomMember(profile, "creator", timestamp)],
      Math.max(0, Math.floor(input?.sharedCoins ?? 0)),
      timestamp
    ),
    seedKind: input?.seedKind ?? "dev-current-room",
    createdAt: timestamp,
    updatedAt: timestamp,
    roomState: createSharedRoomSeed(roomId, input?.sourceRoomState),
    frameMemories: {},
    sharedPet: null
  });

  database.rooms[roomId] = roomDocument;
  database.invites[inviteCode] = {
    code: inviteCode,
    roomId,
    creatorPlayerId: profile.playerId,
    status: "open",
    createdAt: timestamp,
    consumedAt: null
  };

  return roomDocument;
}

export function bootstrapDevSharedRoomInDatabase(database, input) {
  const profile = upsertProfileInDatabase(database, input?.profile);
  const timestamp = createTimestamp();
  const existingRoom = database.rooms[DEV_SHARED_ROOM_ID]
    ? normalizeStoredSharedRoomDocument(database.rooms[DEV_SHARED_ROOM_ID], timestamp)
    : null;

  if (existingRoom) {
    database.rooms[DEV_SHARED_ROOM_ID] = existingRoom;
  }

  if (!existingRoom) {
    const creatorMember = createSharedRoomMember(profile, "creator", timestamp);
    const roomDocument = validateSharedRoomDocument({
      roomId: DEV_SHARED_ROOM_ID,
      inviteCode: DEV_SHARED_ROOM_INVITE_CODE,
      memberIds: [profile.playerId],
      members: [creatorMember],
      revision: 1,
      progression: createInitialSharedRoomProgression(
        [profile.playerId],
        [creatorMember],
        Math.max(0, Math.floor(input?.sharedCoins ?? 0)),
        timestamp
      ),
      seedKind: "dev-current-room",
      createdAt: timestamp,
      updatedAt: timestamp,
      roomState: createSharedRoomSeed(DEV_SHARED_ROOM_ID, input?.sourceRoomState),
      frameMemories: {},
      sharedPet: null
    });

    database.rooms[DEV_SHARED_ROOM_ID] = roomDocument;
    database.invites[DEV_SHARED_ROOM_INVITE_CODE] = {
      code: DEV_SHARED_ROOM_INVITE_CODE,
      roomId: DEV_SHARED_ROOM_ID,
      creatorPlayerId: profile.playerId,
      status: "open",
      createdAt: timestamp,
      consumedAt: null
    };

    return roomDocument;
  }

  const existingMember = existingRoom.members.find((member) => member.playerId === profile.playerId);

  if (existingMember) {
    return existingRoom;
  }

  if (existingRoom.members.length >= 2) {
    throw new SharedRoomHttpError("Dev shared room already has two partners", 409);
  }

  const nextRoomDocument = validateSharedRoomDocument({
    ...existingRoom,
    memberIds: [...existingRoom.memberIds, profile.playerId],
    members: [...existingRoom.members, createSharedRoomMember(profile, "partner", timestamp)],
    progression: existingRoom.progression,
    updatedAt: timestamp
  });

  database.rooms[DEV_SHARED_ROOM_ID] = nextRoomDocument;
  database.invites[DEV_SHARED_ROOM_INVITE_CODE] = {
    code: DEV_SHARED_ROOM_INVITE_CODE,
    roomId: DEV_SHARED_ROOM_ID,
    creatorPlayerId: nextRoomDocument.members[0]?.playerId ?? profile.playerId,
    status: "consumed",
    createdAt:
      database.invites[DEV_SHARED_ROOM_INVITE_CODE]?.createdAt ?? nextRoomDocument.createdAt,
    consumedAt: timestamp
  };

  return nextRoomDocument;
}

export function loadSharedRoomInDatabase(database, roomId) {
  const roomDocument = database.rooms[roomId];

  if (!roomDocument) {
    throw new SharedRoomHttpError("Shared room not found", 404);
  }

  const normalizedRoomDocument = normalizeStoredSharedRoomDocument(roomDocument);
  database.rooms[roomId] = normalizedRoomDocument;
  return normalizedRoomDocument;
}

export function joinSharedRoomInDatabase(database, input) {
  const profile = upsertProfileInDatabase(database, input?.profile);
  const inviteCode = normalizeInviteCode(input?.code);
  const invite = database.invites[inviteCode];

  if (!invite) {
    throw new SharedRoomHttpError("Invite code is invalid", 404);
  }

  const roomDocument = loadSharedRoomInDatabase(database, invite.roomId);
  const existingMember = roomDocument.members.find((member) => member.playerId === profile.playerId);

  if (existingMember) {
    return roomDocument;
  }

  if (invite.status !== "open") {
    throw new SharedRoomHttpError("Invite code has already been used", 409);
  }

  if (roomDocument.members.length >= 2) {
    throw new SharedRoomHttpError("Shared room already has two partners", 409);
  }

  const timestamp = createTimestamp();
  const nextRoomDocument = validateSharedRoomDocument({
    ...roomDocument,
    memberIds: [...roomDocument.memberIds, profile.playerId],
    members: [...roomDocument.members, createSharedRoomMember(profile, "partner", timestamp)],
    progression: roomDocument.progression,
    updatedAt: timestamp
  });

  database.rooms[roomDocument.roomId] = nextRoomDocument;
  database.invites[inviteCode] = {
    ...invite,
    status: "consumed",
    consumedAt: timestamp
  };

  return nextRoomDocument;
}

export function commitSharedRoomStateInDatabase(database, input) {
  const roomDocument = loadSharedRoomInDatabase(database, input?.roomId);
  const timestamp = createTimestamp();

  if (input?.expectedRevision !== undefined && input?.expectedRevision !== roomDocument.revision) {
    throw new SharedRoomHttpError("Shared room revision conflict.", 409);
  }

  const nextRoomDocument = validateSharedRoomDocument({
    ...roomDocument,
    revision: roomDocument.revision + 1,
    progression: advanceRitualDayIfNeeded(
      input?.progression ?? roomDocument.progression,
      roomDocument.memberIds,
      roomDocument.members,
      timestamp
    ),
    updatedAt: timestamp,
    roomState: {
      ...input?.roomState,
      metadata: {
        ...input?.roomState?.metadata,
        roomId: roomDocument.roomId
      }
    },
    frameMemories: input?.frameMemories ?? roomDocument.frameMemories,
    sharedPet:
      input?.sharedPet === undefined ? roomDocument.sharedPet : input.sharedPet
  });

  database.rooms[roomDocument.roomId] = nextRoomDocument;

  return nextRoomDocument;
}

function ensurePlayerBelongsToSharedRoom(roomDocument, playerId) {
  if (!roomDocument.memberIds.includes(playerId)) {
    throw new SharedRoomHttpError("Player is not a member of this shared room", 403);
  }
}

function createEmptySharedPresenceRoomSnapshot(roomId, updatedAt = createTimestamp()) {
  return validateSharedPresenceRoomSnapshot({
    roomId,
    presences: [],
    sharedPetState: null,
    updatedAt
  });
}

function createEmptySharedEditLockRoomSnapshot(roomId, updatedAt = createTimestamp()) {
  return validateSharedEditLockRoomSnapshot({
    roomId,
    locks: [],
    updatedAt
  });
}

function pruneExpiredRoomPresence(roomPresence, now = Date.now()) {
  const nextPresences = roomPresence.presences.filter((presence) => {
    const updatedAt = Date.parse(presence.updatedAt);
    return Number.isFinite(updatedAt) && now - updatedAt <= SHARED_PRESENCE_TTL_MS;
  });

  if (nextPresences.length === roomPresence.presences.length) {
    return roomPresence;
  }

  return validateSharedPresenceRoomSnapshot({
    roomId: roomPresence.roomId,
    presences: nextPresences,
    sharedPetState: roomPresence.sharedPetState ?? null,
    updatedAt: createTimestamp(now)
  });
}

function loadSharedRoomPresenceSnapshotInDatabase(database, roomId) {
  loadSharedRoomInDatabase(database, roomId);

  const roomPresence = database.presenceByRoom[roomId];

  if (!roomPresence) {
    const emptySnapshot = createEmptySharedPresenceRoomSnapshot(roomId);
    database.presenceByRoom[roomId] = emptySnapshot;
    return emptySnapshot;
  }

  const validatedPresence = validateSharedPresenceRoomSnapshot(roomPresence);
  const nextRoomPresence = pruneExpiredRoomPresence(validatedPresence);
  database.presenceByRoom[roomId] = nextRoomPresence;
  return nextRoomPresence;
}

function pruneExpiredRoomLocks(roomLocks, now = Date.now()) {
  const nextLocks = roomLocks.locks.filter((lock) => {
    const expiresAt = Date.parse(lock.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now;
  });

  if (nextLocks.length === roomLocks.locks.length) {
    return roomLocks;
  }

  return validateSharedEditLockRoomSnapshot({
    roomId: roomLocks.roomId,
    locks: nextLocks,
    updatedAt: createTimestamp(now)
  });
}

function loadSharedRoomLockSnapshotInDatabase(database, roomId) {
  loadSharedRoomInDatabase(database, roomId);

  const roomLocks = database.locksByRoom[roomId];

  if (!roomLocks) {
    const emptySnapshot = createEmptySharedEditLockRoomSnapshot(roomId);
    database.locksByRoom[roomId] = emptySnapshot;
    return emptySnapshot;
  }

  const validatedLocks = validateSharedEditLockRoomSnapshot(roomLocks);
  const nextRoomLocks = pruneExpiredRoomLocks(validatedLocks);
  database.locksByRoom[roomId] = nextRoomLocks;
  return nextRoomLocks;
}

function requireLockField(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SharedRoomHttpError(`${fieldName} is required`, 400);
  }

  return value.trim();
}

export function upsertSharedPresenceInDatabase(database, input) {
  const presence = validateSharedPresenceSnapshot(input?.presence);
  const sharedPetState =
    input?.sharedPetState === undefined
      ? undefined
      : input.sharedPetState === null
        ? null
        : input.sharedPetState;
  const roomDocument = loadSharedRoomInDatabase(database, presence.roomId);
  const timestamp = createTimestamp();

  ensurePlayerBelongsToSharedRoom(roomDocument, presence.playerId);

  const roomPresence = loadSharedRoomPresenceSnapshotInDatabase(database, presence.roomId);
  const nextRoomPresence = validateSharedPresenceRoomSnapshot({
    roomId: presence.roomId,
    presences: [
      ...roomPresence.presences.filter((entry) => entry.playerId !== presence.playerId),
      {
        ...presence,
        updatedAt: timestamp
      }
    ],
    sharedPetState:
      sharedPetState === undefined
        ? roomPresence.sharedPetState ?? null
        : sharedPetState === null
          ? null
          : {
              ...sharedPetState,
              updatedAt: timestamp
            },
    updatedAt: timestamp
  });

  database.presenceByRoom[presence.roomId] = nextRoomPresence;

  return nextRoomPresence.presences.find((entry) => entry.playerId === presence.playerId);
}

export function loadRoomPresenceInDatabase(database, roomId) {
  return loadSharedRoomPresenceSnapshotInDatabase(database, roomId);
}

export function leaveSharedPresenceInDatabase(database, input) {
  const roomId = input?.roomId;
  const playerId = input?.playerId;

  if (typeof roomId !== "string" || roomId.length === 0) {
    throw new SharedRoomHttpError("Room id is required", 400);
  }

  if (typeof playerId !== "string" || playerId.length === 0) {
    throw new SharedRoomHttpError("Player id is required", 400);
  }

  const roomDocument = loadSharedRoomInDatabase(database, roomId);
  const timestamp = createTimestamp();

  ensurePlayerBelongsToSharedRoom(roomDocument, playerId);

  const roomPresence = loadSharedRoomPresenceSnapshotInDatabase(database, roomId);
  const nextRoomPresence = validateSharedPresenceRoomSnapshot({
    roomId,
    presences: roomPresence.presences.filter((entry) => entry.playerId !== playerId),
    sharedPetState: roomPresence.sharedPetState ?? null,
    updatedAt: timestamp
  });

  database.presenceByRoom[roomId] = nextRoomPresence;

  return nextRoomPresence;
}

export function loadRoomLocksInDatabase(database, roomId) {
  return loadSharedRoomLockSnapshotInDatabase(database, roomId);
}

export function acquireEditLockInDatabase(database, input) {
  const roomId = requireLockField(input?.roomId, "Room id");
  const furnitureId = requireLockField(input?.furnitureId, "Furniture id");
  const playerId = requireLockField(input?.playerId, "Player id");
  const displayName = requireLockField(input?.displayName, "Display name");
  const roomDocument = loadSharedRoomInDatabase(database, roomId);
  const timestampMs = Date.now();
  const timestamp = createTimestamp(timestampMs);

  ensurePlayerBelongsToSharedRoom(roomDocument, playerId);

  const roomLocks = loadSharedRoomLockSnapshotInDatabase(database, roomId);
  const existingLock = roomLocks.locks.find((lock) => lock.furnitureId === furnitureId);

  if (existingLock && existingLock.playerId !== playerId) {
    throw new SharedRoomHttpError("Your partner is editing this item", 409);
  }

  const nextLock = validateSharedEditLock({
    roomId,
    furnitureId,
    playerId,
    displayName,
    expiresAt: createTimestamp(timestampMs + SHARED_EDIT_LOCK_TTL_MS),
    updatedAt: timestamp
  });
  const nextRoomLocks = validateSharedEditLockRoomSnapshot({
    roomId,
    locks: [
      ...roomLocks.locks.filter((lock) => lock.furnitureId !== furnitureId),
      nextLock
    ],
    updatedAt: timestamp
  });

  database.locksByRoom[roomId] = nextRoomLocks;

  return nextRoomLocks;
}

export function renewEditLockInDatabase(database, input) {
  const roomId = requireLockField(input?.roomId, "Room id");
  const furnitureId = requireLockField(input?.furnitureId, "Furniture id");
  const playerId = requireLockField(input?.playerId, "Player id");
  const displayName = requireLockField(input?.displayName, "Display name");
  const roomDocument = loadSharedRoomInDatabase(database, roomId);
  const timestampMs = Date.now();
  const timestamp = createTimestamp(timestampMs);

  ensurePlayerBelongsToSharedRoom(roomDocument, playerId);

  const roomLocks = loadSharedRoomLockSnapshotInDatabase(database, roomId);
  const existingLock = roomLocks.locks.find((lock) => lock.furnitureId === furnitureId);

  if (!existingLock || existingLock.playerId !== playerId) {
    throw new SharedRoomHttpError("Edit lock is no longer active", 410);
  }

  const nextLock = validateSharedEditLock({
    ...existingLock,
    displayName,
    expiresAt: createTimestamp(timestampMs + SHARED_EDIT_LOCK_TTL_MS),
    updatedAt: timestamp
  });
  const nextRoomLocks = validateSharedEditLockRoomSnapshot({
    roomId,
    locks: [
      ...roomLocks.locks.filter((lock) => lock.furnitureId !== furnitureId),
      nextLock
    ],
    updatedAt: timestamp
  });

  database.locksByRoom[roomId] = nextRoomLocks;

  return nextRoomLocks;
}

export function releaseEditLockInDatabase(database, input) {
  const roomId = requireLockField(input?.roomId, "Room id");
  const furnitureId = requireLockField(input?.furnitureId, "Furniture id");
  const playerId = requireLockField(input?.playerId, "Player id");
  const roomDocument = loadSharedRoomInDatabase(database, roomId);
  const timestamp = createTimestamp();

  ensurePlayerBelongsToSharedRoom(roomDocument, playerId);

  const roomLocks = loadSharedRoomLockSnapshotInDatabase(database, roomId);
  const nextRoomLocks = validateSharedEditLockRoomSnapshot({
    roomId,
    locks: roomLocks.locks.filter(
      (lock) => !(lock.furnitureId === furnitureId && lock.playerId === playerId)
    ),
    updatedAt: timestamp
  });

  database.locksByRoom[roomId] = nextRoomLocks;

  return nextRoomLocks;
}

async function readRequestJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function writeJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

export function sharedRoomDevPlugin() {
  return {
    name: "sharedRoomDevPlugin",
    apply: "serve",
    configureServer(server) {
      const databasePath = path.resolve(server.config.root, ".data", SHARED_ROOM_DEV_DB_FILENAME);

      server.middlewares.use(async (request, response, next) => {
        const method = request.method ?? "GET";
        const requestUrl = request.url ? new URL(request.url, "http://localhost") : null;

        if (!requestUrl || !requestUrl.pathname.startsWith("/api/dev/shared-room")) {
          next();
          return;
        }

        try {
          const database = await loadSharedRoomDevDatabase(databasePath);

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/create") {
            const requestBody = await readRequestJson(request);
            const roomDocument = createSharedRoomInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomDocument);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/dev-bootstrap") {
            const requestBody = await readRequestJson(request);
            const roomDocument = bootstrapDevSharedRoomInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomDocument);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/join") {
            const requestBody = await readRequestJson(request);
            const roomDocument = joinSharedRoomInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomDocument);
            return;
          }

          if (method === "GET" && requestUrl.pathname.startsWith("/api/dev/shared-room/room/")) {
            const roomId = decodeURIComponent(
              requestUrl.pathname.slice("/api/dev/shared-room/room/".length)
            );
            const roomDocument = loadSharedRoomInDatabase(database, roomId);
            writeJson(response, 200, roomDocument);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/commit") {
            const requestBody = await readRequestJson(request);
            const roomDocument = commitSharedRoomStateInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomDocument);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/presence/upsert") {
            const requestBody = await readRequestJson(request);
            const presence = upsertSharedPresenceInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, presence);
            return;
          }

          if (
            method === "GET" &&
            requestUrl.pathname.startsWith("/api/dev/shared-room/presence/room/")
          ) {
            const roomId = decodeURIComponent(
              requestUrl.pathname.slice("/api/dev/shared-room/presence/room/".length)
            );
            const roomPresence = loadRoomPresenceInDatabase(database, roomId);
            writeJson(response, 200, roomPresence);
            return;
          }

          if (
            method === "GET" &&
            requestUrl.pathname.startsWith("/api/dev/shared-room/locks/room/")
          ) {
            const roomId = decodeURIComponent(
              requestUrl.pathname.slice("/api/dev/shared-room/locks/room/".length)
            );
            const roomLocks = loadRoomLocksInDatabase(database, roomId);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomLocks);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/locks/acquire") {
            const requestBody = await readRequestJson(request);
            const roomLocks = acquireEditLockInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomLocks);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/locks/renew") {
            const requestBody = await readRequestJson(request);
            const roomLocks = renewEditLockInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomLocks);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/locks/release") {
            const requestBody = await readRequestJson(request);
            const roomLocks = releaseEditLockInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomLocks);
            return;
          }

          if (method === "POST" && requestUrl.pathname === "/api/dev/shared-room/presence/leave") {
            const requestBody = await readRequestJson(request);
            const roomPresence = leaveSharedPresenceInDatabase(database, requestBody);
            await writeSharedRoomDevDatabase(databasePath, database);
            writeJson(response, 200, roomPresence);
            return;
          }

          writeJson(response, 404, { error: "Shared room endpoint not found" });
        } catch (error) {
          if (error instanceof SharedRoomHttpError) {
            writeJson(response, error.status, { error: error.message });
            return;
          }

          const message = error instanceof Error ? error.message : "Unexpected shared room error";
          writeJson(response, 500, { error: message });
        }
      });
    }
  };
}
