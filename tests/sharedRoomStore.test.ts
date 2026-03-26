import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
import { createSharedRoomPetRecord } from "../src/lib/sharedRoomPet";
// @ts-ignore Vitest can import the dev-only .mjs plugin helpers directly.
const sharedRoomDevPluginModule = await import("../scripts/sharedRoomDevPlugin.mjs");
const {
  DEV_SHARED_ROOM_ID,
  DEV_SHARED_ROOM_INVITE_CODE,
  bootstrapDevSharedRoomInDatabase,
  commitSharedRoomStateInDatabase,
  createEmptySharedRoomDevDatabase,
  createSharedRoomInDatabase,
  joinSharedRoomInDatabase
} = sharedRoomDevPluginModule as any;

function createProfile(playerId: string, displayName: string) {
  return {
    playerId,
    displayName,
    createdAt: "2026-03-26T13:00:00.000Z",
    updatedAt: "2026-03-26T13:00:00.000Z"
  };
}

describe("sharedRoomStore", () => {
  it("bootstraps a deterministic development shared room", () => {
    const database = createEmptySharedRoomDevDatabase();
    const firstProfile = createProfile("player-1", "Ari");
    const secondProfile = createProfile("player-2", "Bea");

    const firstJoin = bootstrapDevSharedRoomInDatabase(database, {
      profile: firstProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 45
    });
    const secondJoin = bootstrapDevSharedRoomInDatabase(database, {
      profile: secondProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 99
    });

    expect(firstJoin.roomId).toBe(DEV_SHARED_ROOM_ID);
    expect(firstJoin.inviteCode).toBe(DEV_SHARED_ROOM_INVITE_CODE);
    expect(secondJoin.memberIds).toEqual(["player-1", "player-2"]);
    expect(secondJoin.progression.players["player-1"]?.coins).toBe(45);
    expect(secondJoin.progression.players["player-2"]).toMatchObject({
      coins: 0,
      level: 1,
      xp: 0
    });
    expect(secondJoin.frameMemories).toEqual({});
    expect(secondJoin.sharedPet).toBeNull();
  });

  it("rejects a third distinct dev profile after two partners join", () => {
    const database = createEmptySharedRoomDevDatabase();

    bootstrapDevSharedRoomInDatabase(database, {
      profile: createProfile("player-1", "Ari"),
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 45
    });
    bootstrapDevSharedRoomInDatabase(database, {
      profile: createProfile("player-2", "Bea"),
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 45
    });

    expect(() =>
      bootstrapDevSharedRoomInDatabase(database, {
        profile: createProfile("player-3", "Cy"),
        sourceRoomState: createDefaultRoomState(),
        sharedCoins: 45
      })
    ).toThrow("Dev shared room already has two partners");
  });

  it("consumes invite only once", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const partnerProfile = createProfile("player-2", "Bea");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });

    const joinedRoom = joinSharedRoomInDatabase(database, {
      code: roomDocument.inviteCode,
      profile: partnerProfile
    });

    expect(joinedRoom.memberIds).toEqual(["player-1", "player-2"]);
    expect(joinedRoom.progression.players["player-1"]?.coins).toBe(50);
    expect(joinedRoom.progression.players["player-2"]?.coins).toBe(0);
    expect(database.invites[roomDocument.inviteCode].status).toBe("consumed");
    expect(() =>
      joinSharedRoomInDatabase(database, {
        code: roomDocument.inviteCode,
        profile: createProfile("player-3", "Cy")
      })
    ).toThrow("Invite code has already been used");
  });

  it("rejects stale progression commits with a 409", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });
    const firstRoomState = createDefaultRoomState();
    const secondRoomState = createDefaultRoomState();

    firstRoomState.metadata.roomId = roomDocument.roomId;
    secondRoomState.metadata.roomId = roomDocument.roomId;
    firstRoomState.furniture[0] = {
      ...firstRoomState.furniture[0],
      position: [1, 0, -2]
    };
    secondRoomState.furniture[0] = {
      ...secondRoomState.furniture[0],
      position: [2, 0, -1]
    };

    const firstCommitProgression = {
      ...roomDocument.progression,
      players: {
        ...roomDocument.progression.players,
        "player-1": {
          ...roomDocument.progression.players["player-1"],
          coins: 55
        }
      }
    };

    const firstCommit = commitSharedRoomStateInDatabase(database, {
      roomId: roomDocument.roomId,
      expectedRevision: roomDocument.revision,
      roomState: firstRoomState,
      progression: firstCommitProgression,
      reason: "first progression write"
    });

    expect(firstCommit.revision).toBe(2);

    expect(() =>
      commitSharedRoomStateInDatabase(database, {
        roomId: roomDocument.roomId,
        expectedRevision: roomDocument.revision,
        roomState: secondRoomState,
        progression: roomDocument.progression,
        reason: "stale progression write"
      })
    ).toThrow("Shared room revision conflict.");
    expect(database.rooms[roomDocument.roomId].revision).toBe(2);
    expect(database.rooms[roomDocument.roomId].progression.players["player-1"]?.coins).toBe(55);
    expect(database.rooms[roomDocument.roomId].roomState.furniture[0].position).toEqual([
      1,
      0,
      -2
    ]);
  });

  it("persists updated room and progression data on a valid commit", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });
    const nextRoomState = createDefaultRoomState();

    nextRoomState.metadata.roomId = roomDocument.roomId;
    nextRoomState.furniture[0] = {
      ...nextRoomState.furniture[0],
      position: [1.5, 0, -1.5]
    };

    const nextProgression = {
      ...roomDocument.progression,
      players: {
        ...roomDocument.progression.players,
        "player-1": {
          ...roomDocument.progression.players["player-1"],
          coins: 60
        }
      }
    };

    const committedRoom = commitSharedRoomStateInDatabase(database, {
      roomId: roomDocument.roomId,
      expectedRevision: roomDocument.revision,
      roomState: nextRoomState,
      progression: nextProgression,
      reason: "buy furniture"
    });

    expect(committedRoom.revision).toBe(2);
    expect(database.rooms[roomDocument.roomId].progression.players["player-1"]?.coins).toBe(60);
    expect(database.rooms[roomDocument.roomId].roomState.furniture[0].position).toEqual([
      1.5,
      0,
      -1.5
    ]);
  });

  it("persists frame memories and a shared pet on a valid commit", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });

    const committedRoom = commitSharedRoomStateInDatabase(database, {
      roomId: roomDocument.roomId,
      expectedRevision: roomDocument.revision,
      roomState: roomDocument.roomState,
      progression: roomDocument.progression,
      frameMemories: {
        "starter-wall-frame": {
          furnitureId: "starter-wall-frame",
          imageSrc: "data:image/jpeg;base64,abc",
          caption: "Our room",
          updatedAt: "2026-03-26T15:00:00.000Z",
          updatedByPlayerId: creatorProfile.playerId
        }
      },
      sharedPet: createSharedRoomPetRecord(
        [0.5, 0, 1.25],
        creatorProfile.playerId,
        "2026-03-26T15:00:00.000Z"
      ),
      reason: "memory_and_pet"
    });

    expect(committedRoom.frameMemories["starter-wall-frame"]).toMatchObject({
      caption: "Our room"
    });
    expect(committedRoom.sharedPet).toMatchObject({
      type: "minecraft_cat",
      presetId: "better_cat_glb"
    });
  });
});
