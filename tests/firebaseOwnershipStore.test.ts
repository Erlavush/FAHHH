import { describe, expect, it } from "vitest";
import {
  createEmptyFirebaseHostedDatabase,
  createFirebaseOwnershipStore
} from "../src/lib/firebaseOwnershipStore";
import { createFirebaseRoomStore } from "../src/lib/firebaseRoomStore";
import type { SharedRoomBootstrapState } from "../src/lib/sharedRoomTypes";

function createProfile(playerId: string, displayName: string) {
  return {
    playerId,
    displayName,
    createdAt: "2026-03-27T00:00:00.000Z",
    updatedAt: "2026-03-27T00:00:00.000Z"
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

describe("firebaseOwnershipStore", () => {
  it("returns needs_linking with a reusable self pair code before membership exists", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });

    const firstBootstrap = await ownershipStore.loadBootstrapState({
      profile: createProfile("player-1", "Ari")
    });
    const secondBootstrap = await ownershipStore.loadBootstrapState({
      profile: createProfile("player-1", "Ari")
    });

    expect(firstBootstrap.kind).toBe("needs_linking");
    expect(firstBootstrap.selfPairCode).toBe(secondBootstrap.selfPairCode);
    expect(database.pairCodes["player-1"]).toMatchObject({
      playerId: "player-1",
      displayName: "Ari"
    });
  });

  it("creates the starter room and shared cat only after both confirmations", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const roomStore = createFirebaseRoomStore({ database });
    const ari = createProfile("player-1", "Ari");
    const bea = createProfile("player-2", "Bea");
    const beaBootstrap = await ownershipStore.loadBootstrapState({ profile: bea });

    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: ari,
      pairCode: beaBootstrap.selfPairCode.toLowerCase()
    });
    const pendingLinkState = requirePendingLinkState(pendingBootstrap);

    expect(Object.keys(database.sharedRooms)).toHaveLength(0);

    const afterFirstConfirm = await ownershipStore.confirmPairLink({
      profile: ari,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });

    expect(afterFirstConfirm.kind).toBe("pending_link");
    expect(Object.keys(database.sharedRooms)).toHaveLength(0);

    const finalBootstrap = await ownershipStore.confirmPairLink({
      profile: bea,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });
    const pairedRoomState = requirePairedRoomState(finalBootstrap);

    expect(Object.keys(database.sharedRooms)).toHaveLength(1);
    expect(Object.keys(database.roomMemberships)).toEqual(["player-1", "player-2"]);

    const roomDocument = await roomStore.loadSharedRoom({
      roomId: pairedRoomState.membership.roomId
    });

    expect(roomDocument.progression.players["player-1"]).toBeTruthy();
    expect(roomDocument.progression.players["player-2"]).toBeTruthy();
    expect(roomDocument.sharedPet).toMatchObject({
      type: "minecraft_cat",
      adoptedByPlayerId: "player-2"
    });
    expect(database.pendingPairLinks).toEqual({});
  });

  it("rejects already-paired accounts from confirming or submitting new links", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const ari = createProfile("player-1", "Ari");
    const bea = createProfile("player-2", "Bea");
    const cy = createProfile("player-3", "Cy");
    const beaBootstrap = await ownershipStore.loadBootstrapState({ profile: bea });

    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: ari,
      pairCode: beaBootstrap.selfPairCode
    });
    const pendingLinkState = requirePendingLinkState(pendingBootstrap);

    await ownershipStore.confirmPairLink({
      profile: ari,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });
    await ownershipStore.confirmPairLink({
      profile: bea,
      pendingLinkId: pendingLinkState.pendingLink.pendingLinkId
    });

    await expect(
      ownershipStore.submitPairCode({
        profile: ari,
        pairCode: (await ownershipStore.loadBootstrapState({ profile: cy })).selfPairCode
      })
    ).rejects.toThrow("Already paired accounts cannot start a new couple room link.");
  });
});
