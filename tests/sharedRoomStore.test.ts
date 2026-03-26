import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
// @ts-ignore Vitest can import the dev-only .mjs plugin helpers directly.
const sharedRoomDevPluginModule = await import("../scripts/sharedRoomDevPlugin.mjs");
const {
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
