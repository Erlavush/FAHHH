import { describe, expect, it, vi } from "vitest";
import { createSharedPresenceStore } from "../src/lib/sharedPresenceClient";
import { createDefaultRoomState } from "../src/lib/roomState";
// @ts-ignore Vitest can import the dev-only .mjs plugin helpers directly.
const sharedRoomDevPluginModule = await import("../scripts/sharedRoomDevPlugin.mjs");
const {
  createEmptySharedRoomDevDatabase,
  createSharedRoomInDatabase,
  loadRoomPresenceInDatabase,
  upsertSharedPresenceInDatabase
} = sharedRoomDevPluginModule as any;

function createProfile(playerId: string, displayName: string) {
  return {
    playerId,
    displayName,
    createdAt: "2026-03-26T13:00:00.000Z",
    updatedAt: "2026-03-26T13:00:00.000Z"
  };
}

function createPresenceSnapshot(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    roomId: (overrides.roomId as string | undefined) ?? "shared-room-1",
    playerId: (overrides.playerId as string | undefined) ?? "player-1",
    displayName: (overrides.displayName as string | undefined) ?? "Ari",
    skinSrc: (overrides.skinSrc as string | null | undefined) ?? null,
    position: (overrides.position as [number, number, number] | undefined) ?? [1.25, 0, -2.5],
    facingY: (overrides.facingY as number | undefined) ?? Math.PI / 3,
    activity: (overrides.activity as string | undefined) ?? "walking",
    pose: (overrides.pose as object | null | undefined) ?? null,
    updatedAt: (overrides.updatedAt as string | undefined) ?? "2026-03-26T13:05:00.000Z"
  };
}

describe("sharedRoomPresence", () => {
  it("presence updates do not mutate the room revision", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile("player-1", "Ari");
    const partnerProfile = createProfile("player-2", "Bea");
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });
    const startingRevision = roomDocument.revision;

    database.rooms[roomDocument.roomId] = {
      ...roomDocument,
      memberIds: [creatorProfile.playerId, partnerProfile.playerId],
      members: [
        {
          playerId: creatorProfile.playerId,
          displayName: creatorProfile.displayName,
          role: "creator",
          joinedAt: creatorProfile.createdAt
        },
        {
          playerId: partnerProfile.playerId,
          displayName: partnerProfile.displayName,
          role: "partner",
          joinedAt: partnerProfile.createdAt
        }
      ]
    };

    const nextPresence = upsertSharedPresenceInDatabase(database, {
      presence: createPresenceSnapshot({
        roomId: roomDocument.roomId,
        playerId: partnerProfile.playerId,
        displayName: partnerProfile.displayName,
        skinSrc: "/skins/partner.png",
        activity: "sit",
        pose: {
          type: "sit",
          position: [0.5, 0, -1.4],
          rotationY: Math.PI
        }
      })
    });
    const roomPresence = loadRoomPresenceInDatabase(database, roomDocument.roomId);

    expect(database.rooms[roomDocument.roomId].revision).toBe(startingRevision);
    expect(nextPresence.position).toEqual([1.25, 0, -2.5]);
    expect(nextPresence.facingY).toBe(Math.PI / 3);
    expect(nextPresence.activity).toBe("sit");
    expect(roomPresence.presences).toHaveLength(1);
    expect(roomPresence.presences[0]).toMatchObject({
      playerId: partnerProfile.playerId,
      position: [1.25, 0, -2.5],
      facingY: Math.PI / 3,
      activity: "sit"
    });
  });

  it("loads remote partner snapshots with position, facing, and activity", async () => {
    const remotePresence = createPresenceSnapshot({
      playerId: "player-2",
      displayName: "Bea",
      facingY: 1.75,
      activity: "use_pc",
      pose: {
        type: "use_pc",
        position: [0.25, 0, -3.6],
        rotationY: Math.PI
      }
    });
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            roomId: "shared-room-1",
            presences: [remotePresence],
            updatedAt: "2026-03-26T13:06:00.000Z"
          })
        )
    });
    const sharedPresenceStore = createSharedPresenceStore(fetchImpl as never);
    const roomPresence = await sharedPresenceStore.loadRoomPresence({
      roomId: "shared-room-1"
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/dev/shared-room/presence/room/shared-room-1",
      undefined
    );
    expect(roomPresence.presences[0]).toMatchObject({
      position: [1.25, 0, -2.5],
      facingY: 1.75,
      activity: "use_pc"
    });
  });
});
