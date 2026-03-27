import { describe, expect, it, vi } from "vitest";
import { createSharedPresenceStore } from "../src/lib/sharedPresenceClient";
import {
  createEmptyFirebaseHostedDatabase,
  createFirebaseOwnershipStore
} from "../src/lib/firebaseOwnershipStore";
import { createFirebasePresenceStore } from "../src/lib/firebasePresenceStore";
import { createDefaultRoomState } from "../src/lib/roomState";
import type {
  SharedPresenceActivity,
  SharedPresenceSnapshot
} from "../src/lib/sharedPresenceTypes";
import type { SharedRoomBootstrapState } from "../src/lib/sharedRoomTypes";
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

function requirePendingLinkState(
  state: SharedRoomBootstrapState
): Extract<SharedRoomBootstrapState, { kind: "pending_link" }> {
  expect(state.kind).toBe("pending_link");

  if (state.kind !== "pending_link") {
    throw new Error("Expected pending_link bootstrap state.");
  }

  return state;
}

function requirePairedRoomState(
  state: SharedRoomBootstrapState
): Extract<SharedRoomBootstrapState, { kind: "paired_room" }> {
  expect(state.kind).toBe("paired_room");

  if (state.kind !== "paired_room") {
    throw new Error("Expected paired_room bootstrap state.");
  }

  return state;
}

function createPresenceSnapshot(
  overrides: Partial<SharedPresenceSnapshot> = {}
): SharedPresenceSnapshot {
  return {
    roomId: overrides.roomId ?? "shared-room-1",
    playerId: overrides.playerId ?? "player-1",
    displayName: overrides.displayName ?? "Ari",
    skinSrc: overrides.skinSrc ?? null,
    position: overrides.position ?? [1.25, 0, -2.5],
    facingY: overrides.facingY ?? Math.PI / 3,
    activity: (overrides.activity ?? "walking") as SharedPresenceActivity,
    pose: overrides.pose ?? null,
    updatedAt: overrides.updatedAt ?? "2026-03-26T13:05:00.000Z"
  };
}

describe("sharedRoomPresence", () => {
  it("keeps room presence separate from canonical room state", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const presenceStore = createFirebasePresenceStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const creatorProfile = createProfile("player-1", "Ari");
    const partnerProfile = createProfile("player-2", "Bea");
    const partnerBootstrap = await ownershipStore.loadBootstrapState({
      profile: partnerProfile
    });
    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: creatorProfile,
      pairCode: partnerBootstrap.selfPairCode
    });
    const pendingLinkState = requirePendingLinkState(pendingBootstrap);

    await ownershipStore.confirmPairLink({
      profile: creatorProfile,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });
    const pairedBootstrap = await ownershipStore.confirmPairLink({
      profile: partnerProfile,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });
    const pairedRoomState = requirePairedRoomState(pairedBootstrap);
    const startingRevision = database.sharedRooms[pairedRoomState.membership.roomId].revision;

    await presenceStore.upsertPresence({
      presence: createPresenceSnapshot({
        roomId: pairedRoomState.membership.roomId,
        playerId: creatorProfile.playerId,
        displayName: creatorProfile.displayName
      })
    });

    const roomPresence = await presenceStore.loadRoomPresence({
      roomId: pairedRoomState.membership.roomId
    });

    expect(database.sharedRooms[pairedRoomState.membership.roomId].revision).toBe(
      startingRevision
    );
    expect(roomPresence.presences).toHaveLength(1);
    expect(roomPresence.presences[0]).toMatchObject({
      playerId: creatorProfile.playerId
    });
  });

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

  it("tracks and clears pair-link presence separately from room presence", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const presenceStore = createFirebasePresenceStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const creatorProfile = createProfile("player-1", "Ari");
    const partnerProfile = createProfile("player-2", "Bea");
    const partnerBootstrap = await ownershipStore.loadBootstrapState({
      profile: partnerProfile
    });
    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: creatorProfile,
      pairCode: partnerBootstrap.selfPairCode
    });
    const pendingLinkState = requirePendingLinkState(pendingBootstrap);

    await presenceStore.upsertPairLinkPresence({
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId,
      playerId: creatorProfile.playerId,
      displayName: creatorProfile.displayName
    });
    await presenceStore.upsertPairLinkPresence({
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId,
      playerId: partnerProfile.playerId,
      displayName: partnerProfile.displayName
    });

    expect(
      (
        await presenceStore.loadPairLinkPresence({
          pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
        })
      ).presences
    ).toHaveLength(2);

    await presenceStore.leavePairLinkPresence({
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId,
      playerId: partnerProfile.playerId
    });

    expect(
      (
        await presenceStore.loadPairLinkPresence({
          pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
        })
      ).presences
    ).toHaveLength(1);
  });
});
