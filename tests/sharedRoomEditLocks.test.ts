// @vitest-environment jsdom

import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialSharedRoomProgression } from "../src/lib/sharedProgression";
import { useSharedRoomRuntime } from "../src/app/hooks/useSharedRoomRuntime";
import {
  createEmptyFirebaseHostedDatabase,
  createFirebaseOwnershipStore
} from "../src/lib/firebaseOwnershipStore";
import { createFirebasePresenceStore } from "../src/lib/firebasePresenceStore";
import { cloneRoomState, createDefaultRoomState } from "../src/lib/roomState";
import {
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import type {
  SharedRoomBootstrapState,
  SharedPlayerProfile,
  SharedRoomDocument
} from "../src/lib/sharedRoomTypes";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// @ts-ignore Vitest can import the dev-only .mjs plugin helpers directly.
const sharedRoomDevPluginModule = await import("../scripts/sharedRoomDevPlugin.mjs");
const {
  SHARED_EDIT_LOCK_TTL_MS,
  acquireEditLockInDatabase,
  createEmptySharedRoomDevDatabase,
  createSharedRoomInDatabase,
  joinSharedRoomInDatabase,
  loadRoomLocksInDatabase
} = sharedRoomDevPluginModule as any;

type HookValue = ReturnType<typeof useSharedRoomRuntime>;

type HarnessProps = {
  sharedRoomStore: SharedRoomStore;
};

let latestHookValue: HookValue | null = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function HookHarness({ sharedRoomStore }: HarnessProps) {
  const devBootstrapRoomState = useMemo(() => createDefaultRoomState(), []);

  latestHookValue = useSharedRoomRuntime({
    devBypassEnabled: false,
    devBootstrapRoomState,
    sharedRoomStore
  });
  return null;
}

function createProfile(
  overrides: Partial<SharedPlayerProfile> = {}
): SharedPlayerProfile {
  return {
    playerId: overrides.playerId ?? "player-1",
    displayName: overrides.displayName ?? "Player One",
    createdAt: overrides.createdAt ?? "2026-03-26T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-26T00:00:00.000Z"
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

function createSharedRoomDocument(
  playerId: string,
  overrides: Partial<SharedRoomDocument> = {}
): SharedRoomDocument {
  const roomState = cloneRoomState(createDefaultRoomState());
  const roomId = overrides.roomId ?? "shared-room-1";
  const memberIds = overrides.memberIds ?? [playerId, "player-2"];
  const members = overrides.members ?? [
    {
      playerId,
      displayName: "Player One",
      role: "creator",
      joinedAt: "2026-03-26T00:00:00.000Z"
    },
    {
      playerId: "player-2",
      displayName: "Player Two",
      role: "partner",
      joinedAt: "2026-03-26T00:01:00.000Z"
    }
  ];

  roomState.metadata.roomId = roomId;

  return {
    roomId,
    inviteCode: overrides.inviteCode ?? "ABC123",
    memberIds,
    members,
    revision: overrides.revision ?? 3,
    progression:
      overrides.progression ??
      createInitialSharedRoomProgression(
        memberIds,
        members,
        140,
        overrides.updatedAt ?? "2026-03-26T00:01:30.000Z"
      ),
    seedKind: overrides.seedKind ?? "dev-current-room",
    createdAt: overrides.createdAt ?? "2026-03-26T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-26T00:01:30.000Z",
    roomState: overrides.roomState ?? roomState,
    frameMemories: overrides.frameMemories ?? {},
    sharedPet: overrides.sharedPet ?? null
  };
}

async function flushHookEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("shared room edit locks", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    window.localStorage.clear();
    latestHookValue = null;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00.000Z"));
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;

    if (container) {
      container.remove();
    }

    container = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("rejects a conflicting partner lock", async () => {
    const database = createEmptyFirebaseHostedDatabase();
    const ownershipStore = createFirebaseOwnershipStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const presenceStore = createFirebasePresenceStore({
      database,
      now: () => "2026-03-27T00:00:00.000Z"
    });
    const creatorProfile = createProfile({
      playerId: "player-1",
      displayName: "Ari"
    });
    const partnerProfile = createProfile({
      playerId: "player-2",
      displayName: "Bea"
    });
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

    await presenceStore.acquireEditLock({
      roomId: pairedRoomState.membership.roomId,
      furnitureId: "starter-bed",
      playerId: creatorProfile.playerId,
      displayName: creatorProfile.displayName
    });

    await expect(
      presenceStore.acquireEditLock({
        roomId: pairedRoomState.membership.roomId,
        furnitureId: "starter-bed",
        playerId: partnerProfile.playerId,
        displayName: partnerProfile.displayName
      })
    ).rejects.toThrow("Your partner is editing this item");
  });

  it("blocks same-item edits until the lock expires", () => {
    const database = createEmptySharedRoomDevDatabase();
    const creatorProfile = createProfile({
      playerId: "player-1",
      displayName: "Ari"
    });
    const partnerProfile = createProfile({
      playerId: "player-2",
      displayName: "Bea"
    });
    const roomDocument = createSharedRoomInDatabase(database, {
      profile: creatorProfile,
      sourceRoomState: createDefaultRoomState(),
      sharedCoins: 50
    });

    joinSharedRoomInDatabase(database, {
      code: roomDocument.inviteCode,
      profile: partnerProfile
    });

    const initialRevision = database.rooms[roomDocument.roomId].revision;

    acquireEditLockInDatabase(database, {
      roomId: roomDocument.roomId,
      furnitureId: "starter-bed",
      playerId: creatorProfile.playerId,
      displayName: creatorProfile.displayName
    });

    expect(() =>
      acquireEditLockInDatabase(database, {
        roomId: roomDocument.roomId,
        furnitureId: "starter-bed",
        playerId: partnerProfile.playerId,
        displayName: partnerProfile.displayName
      })
    ).toThrow("Your partner is editing this item");

    vi.advanceTimersByTime(SHARED_EDIT_LOCK_TTL_MS + 1);

    const partnerLocks = acquireEditLockInDatabase(database, {
      roomId: roomDocument.roomId,
      furnitureId: "starter-bed",
      playerId: partnerProfile.playerId,
      displayName: partnerProfile.displayName
    });

    expect(partnerLocks.locks).toHaveLength(1);
    expect(partnerLocks.locks[0]?.playerId).toBe(partnerProfile.playerId);
    expect(loadRoomLocksInDatabase(database, roomDocument.roomId).locks).toHaveLength(1);
    expect(database.rooms[roomDocument.roomId].revision).toBe(initialRevision);
  });

  it("reloads the canonical room after a stale same-item edit", async () => {
    const profile = createProfile();
    const initialRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 3
    });
    const reloadedRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 4
    });
    const loadSharedRoom = vi
      .fn<SharedRoomStore["loadSharedRoom"]>()
      .mockResolvedValueOnce(initialRoomDocument)
      .mockResolvedValueOnce(reloadedRoomDocument);
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom,
      commitSharedRoomState: vi.fn()
    };

    saveSharedPlayerProfile(profile);
    saveSharedRoomSession({
      playerId: profile.playerId,
      partnerId: "player-2",
      roomId: initialRoomDocument.roomId,
      inviteCode: initialRoomDocument.inviteCode,
      lastKnownRevision: initialRoomDocument.revision
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedRoomStore }));
    });
    await flushHookEffects();

    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(3);

    await act(async () => {
      await latestHookValue?.recoverFromStaleSharedEdit();
    });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(2);
    expect(latestHookValue?.statusMessage).toBe("Reloading latest room...");
    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(4);
  });
});
