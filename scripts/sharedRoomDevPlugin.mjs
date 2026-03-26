import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createSharedRoomSeed } from "../src/lib/sharedRoomSeed";
import {
  isValidSharedPlayerProfile,
  validateSharedRoomDocument
} from "../src/lib/sharedRoomValidation";
import {
  validateSharedPresenceRoomSnapshot,
  validateSharedPresenceSnapshot
} from "../src/lib/sharedPresenceValidation";

export const SHARED_ROOM_DEV_DB_FILENAME = "shared-room-dev-db.json";
export const DEV_SHARED_ROOM_ID = "dev-shared-room";
export const DEV_SHARED_ROOM_INVITE_CODE = "DEVROOM";

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
    presenceByRoom: {}
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

function createTimestamp() {
  return new Date().toISOString();
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

export async function readSharedRoomDevDatabase(databasePath) {
  try {
    const rawDatabase = await readFile(databasePath, "utf8");
    const parsedDatabase = JSON.parse(rawDatabase);

    return {
      profiles: parsedDatabase?.profiles ?? {},
      invites: parsedDatabase?.invites ?? {},
      rooms: parsedDatabase?.rooms ?? {},
      presenceByRoom: parsedDatabase?.presenceByRoom ?? {}
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return createEmptySharedRoomDevDatabase();
    }

    throw error;
  }
}

export async function writeSharedRoomDevDatabase(databasePath, database) {
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, JSON.stringify(database, null, 2));
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
    sharedCoins: Math.max(0, Math.floor(input?.sharedCoins ?? 0)),
    seedKind: input?.seedKind ?? "dev-current-room",
    createdAt: timestamp,
    updatedAt: timestamp,
    roomState: createSharedRoomSeed(roomId, input?.sourceRoomState)
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
    ? loadSharedRoomInDatabase(database, DEV_SHARED_ROOM_ID)
    : null;

  if (!existingRoom) {
    const roomDocument = validateSharedRoomDocument({
      roomId: DEV_SHARED_ROOM_ID,
      inviteCode: DEV_SHARED_ROOM_INVITE_CODE,
      memberIds: [profile.playerId],
      members: [createSharedRoomMember(profile, "creator", timestamp)],
      revision: 1,
      sharedCoins: Math.max(0, Math.floor(input?.sharedCoins ?? 0)),
      seedKind: "dev-current-room",
      createdAt: timestamp,
      updatedAt: timestamp,
      roomState: createSharedRoomSeed(DEV_SHARED_ROOM_ID, input?.sourceRoomState)
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

  return validateSharedRoomDocument(roomDocument);
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
  const nextRoomDocument = validateSharedRoomDocument({
    ...roomDocument,
    revision: roomDocument.revision + 1,
    sharedCoins: Math.max(0, Math.floor(input?.sharedCoins ?? roomDocument.sharedCoins)),
    updatedAt: timestamp,
    roomState: {
      ...input?.roomState,
      metadata: {
        ...input?.roomState?.metadata,
        roomId: roomDocument.roomId
      }
    }
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
    updatedAt
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
  database.presenceByRoom[roomId] = validatedPresence;
  return validatedPresence;
}

export function upsertSharedPresenceInDatabase(database, input) {
  const presence = validateSharedPresenceSnapshot(input?.presence);
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
    updatedAt: timestamp
  });

  database.presenceByRoom[roomId] = nextRoomPresence;

  return nextRoomPresence;
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
          const database = await readSharedRoomDevDatabase(databasePath);

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
