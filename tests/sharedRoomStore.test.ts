import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
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
    expect(secondJoin.roomId).toBe(DEV_SHARED_ROOM_ID);
    expect(secondJoin.inviteCode).toBe(DEV_SHARED_ROOM_INVITE_CODE);
    expect(secondJoin.memberIds).toEqual(["player-1", "player-2"]);
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
    expect(database.invites[roomDocument.inviteCode].status).toBe("consumed");
    expect(() =>
      joinSharedRoomInDatabase(database, {
        code: roomDocument.inviteCode,
        profile: createProfile("player-3", "Cy")
      })
    ).toThrow("Invite code has already been used");
  });

  it("uses last write wins when committed room states race", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });
    const firstCommitRoomState = createDefaultRoomState();
    const secondCommitRoomState = createDefaultRoomState();

    firstCommitRoomState.metadata.roomId = roomDocument.roomId;
    secondCommitRoomState.metadata.roomId = roomDocument.roomId;
    firstCommitRoomState.furniture[0] = {
      ...firstCommitRoomState.furniture[0],
      position: [1, 0, -2]
    };
    secondCommitRoomState.furniture[0] = {
      ...secondCommitRoomState.furniture[0],
      position: [2, 0, -1]
    };

    const firstCommit = commitSharedRoomStateInDatabase(database, {
      roomId: roomDocument.roomId,
      expectedRevision: roomDocument.revision,
      roomState: firstCommitRoomState,
      sharedCoins: 55,
      reason: "first write"
    });
    const secondCommit = commitSharedRoomStateInDatabase(database, {
      roomId: roomDocument.roomId,
      expectedRevision: roomDocument.revision,
      roomState: secondCommitRoomState,
      sharedCoins: 60,
      reason: "last write wins"
    });

    expect(firstCommit.revision).toBe(2);
    expect(secondCommit.revision).toBe(3);
    expect(database.rooms[roomDocument.roomId].sharedCoins).toBe(60);
    expect(database.rooms[roomDocument.roomId].roomState.furniture[0].position).toEqual([
      2,
      0,
      -1
    ]);
  });
});
