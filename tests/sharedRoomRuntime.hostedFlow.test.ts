// @vitest-environment jsdom

import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyFirebaseHostedDatabase,
  createFirebaseOwnershipStore
} from "../src/lib/firebaseOwnershipStore";
import { createFirebaseRoomStore } from "../src/lib/firebaseRoomStore";
import { loadSharedRoomSession } from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import {
  cleanupHookHarness,
  createAuthUser,
  createProfile,
  createSharedAuthHarness,
  flushHookEffects,
  getLatestHookValue,
  mountHookHarness,
  prepareSharedRoomRuntimeTest
} from "./sharedRoomRuntime.fixtures";

describe("shared room runtime hosted flow", () => {
  beforeEach(() => {
    prepareSharedRoomRuntimeTest();
  });

  afterEach(async () => {
    await cleanupHookHarness();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("blocks in a hosted-unavailable state instead of silently entering the dev room", async () => {
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom: vi.fn(),
      commitSharedRoomState: vi.fn()
    };

    await mountHookHarness({
      devBypassEnabled: true,
      hostedFlowEnabled: true,
      sharedAuthAdapter: null,
      sharedRoomOwnershipStore: null,
      sharedRoomStore
    });
    await flushHookEffects();

    expect(getLatestHookValue()?.entryMode).toBe("hosted_unavailable");
    expect(getLatestHookValue()?.bootstrapKind).toBe("hosted_unavailable");
    expect(getLatestHookValue()?.devBypassActive).toBe(false);
    expect(getLatestHookValue()?.runtimeSnapshot).toBeNull();
    expect(getLatestHookValue()?.hostedUnavailableBody).toContain("hosted");
    expect(sharedRoomStore.bootstrapDevSharedRoom).not.toHaveBeenCalled();
  });

  it("loads the paired room automatically for an authenticated member", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const roomStore = createFirebaseRoomStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const ari = createProfile({
      playerId: "firebase-user-1",
      displayName: "Ari"
    });
    const bea = createProfile({
      playerId: "firebase-user-2",
      displayName: "Bea"
    });
    const beaBootstrap = await ownershipStore.loadBootstrapState({ profile: bea });
    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: ari,
      pairCode: beaBootstrap.selfPairCode
    });

    if (pendingBootstrap.kind !== "pending_link") {
      throw new Error("Expected pending link bootstrap state.");
    }

    await ownershipStore.confirmPairLink({
      profile: ari,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });
    await ownershipStore.confirmPairLink({
      profile: bea,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });

    const authHarness = createSharedAuthHarness(
      createAuthUser({
        uid: ari.playerId,
        displayName: ari.displayName
      })
    );

    await mountHookHarness({
      hostedFlowEnabled: true,
      sharedAuthAdapter: authHarness.sharedAuthAdapter,
      sharedRoomOwnershipStore: ownershipStore,
      sharedRoomStore: roomStore
    });
    await flushHookEffects();

    expect(getLatestHookValue()?.entryMode).toBe("hosted");
    expect(getLatestHookValue()?.bootstrapKind).toBe("room_ready");
    expect(getLatestHookValue()?.runtimeSnapshot?.roomId).toBe(
      database.roomMemberships[ari.playerId]?.roomId
    );
    expect(getLatestHookValue()?.session?.playerId).toBe(ari.playerId);
  });

  it("lands authenticated unpaired players in needs_linking with a reusable pair code", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const roomStore = createFirebaseRoomStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const authHarness = createSharedAuthHarness(
      createAuthUser({
        uid: "firebase-user-1",
        displayName: "Ari"
      })
    );

    await mountHookHarness({
      hostedFlowEnabled: true,
      sharedAuthAdapter: authHarness.sharedAuthAdapter,
      sharedRoomOwnershipStore: ownershipStore,
      sharedRoomStore: roomStore
    });
    await flushHookEffects();

    expect(getLatestHookValue()?.bootstrapKind).toBe("needs_linking");
    expect(getLatestHookValue()?.selfPairCode).toMatch(/[A-Z0-9]{8}/);
    expect(getLatestHookValue()?.runtimeSnapshot).toBeNull();
  });

  it("signing out clears cached room convenience state and returns to signed_out", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const roomStore = createFirebaseRoomStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const ari = createProfile({
      playerId: "firebase-user-1",
      displayName: "Ari"
    });
    const bea = createProfile({
      playerId: "firebase-user-2",
      displayName: "Bea"
    });
    const beaBootstrap = await ownershipStore.loadBootstrapState({ profile: bea });
    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: ari,
      pairCode: beaBootstrap.selfPairCode
    });

    if (pendingBootstrap.kind !== "pending_link") {
      throw new Error("Expected pending link bootstrap state.");
    }

    await ownershipStore.confirmPairLink({
      profile: ari,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });
    await ownershipStore.confirmPairLink({
      profile: bea,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });

    const authHarness = createSharedAuthHarness(
      createAuthUser({
        uid: ari.playerId,
        displayName: ari.displayName
      })
    );

    await mountHookHarness({
      hostedFlowEnabled: true,
      sharedAuthAdapter: authHarness.sharedAuthAdapter,
      sharedRoomOwnershipStore: ownershipStore,
      sharedRoomStore: roomStore
    });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.signOut();
    });
    await flushHookEffects();

    expect(getLatestHookValue()?.bootstrapKind).toBe("signed_out");
    expect(getLatestHookValue()?.runtimeSnapshot).toBeNull();
    expect(loadSharedRoomSession()).toBeNull();
  });

  it("allows one partner to enter the paired room while the partner is offline", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const roomStore = createFirebaseRoomStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const ari = createProfile({
      playerId: "firebase-user-1",
      displayName: "Ari"
    });
    const bea = createProfile({
      playerId: "firebase-user-2",
      displayName: "Bea"
    });
    const beaBootstrap = await ownershipStore.loadBootstrapState({ profile: bea });
    const pendingBootstrap = await ownershipStore.submitPairCode({
      profile: ari,
      pairCode: beaBootstrap.selfPairCode
    });

    if (pendingBootstrap.kind !== "pending_link") {
      throw new Error("Expected pending link bootstrap state.");
    }

    await ownershipStore.confirmPairLink({
      profile: ari,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });
    await ownershipStore.confirmPairLink({
      profile: bea,
      pendingLinkId: pendingBootstrap.pendingLink.pendingLinkId
    });

    const authHarness = createSharedAuthHarness(
      createAuthUser({
        uid: bea.playerId,
        displayName: bea.displayName
      })
    );

    await mountHookHarness({
      hostedFlowEnabled: true,
      sharedAuthAdapter: authHarness.sharedAuthAdapter,
      sharedRoomOwnershipStore: ownershipStore,
      sharedRoomStore: roomStore
    });
    await flushHookEffects();

    expect(getLatestHookValue()?.bootstrapKind).toBe("room_ready");
    expect(getLatestHookValue()?.runtimeSnapshot?.memberIds).toEqual(
      expect.arrayContaining([ari.playerId, bea.playerId])
    );
    expect(getLatestHookValue()?.session?.partnerId).toBe(ari.playerId);
  });
});