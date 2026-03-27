// @vitest-environment jsdom

import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyDeskPcCompletionToProgression,
  createInitialSharedRoomProgression
} from "../src/lib/sharedProgression";
import {
  createSharedRoomRuntimeSnapshot,
  createSharedRoomSessionFromDocument,
  shouldCommitSharedRoomChange,
  type SharedAuthAdapter,
  useSharedRoomRuntime
} from "../src/app/hooks/useSharedRoomRuntime";
import { SharedRoomClientError } from "../src/lib/sharedRoomClient";
import {
  createEmptyFirebaseHostedDatabase,
  createFirebaseOwnershipStore
} from "../src/lib/firebaseOwnershipStore";
import { createFirebaseRoomStore } from "../src/lib/firebaseRoomStore";
import { cloneRoomState, createDefaultRoomState } from "../src/lib/roomState";
import {
  loadSharedRoomSession,
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../src/lib/sharedRoomSession";
import { createSharedRoomPetRecord } from "../src/lib/sharedRoomPet";
import { createBreakupResetMutation } from "../src/lib/sharedRoomReset";
import type { SharedRoomOwnershipStore } from "../src/lib/sharedRoomOwnershipStore";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument
} from "../src/lib/sharedRoomTypes";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

type HookValue = ReturnType<typeof useSharedRoomRuntime>;

type MockAuthUser = {
  displayName: string | null;
  email?: string | null;
  metadata: {
    creationTime?: string | null;
    lastSignInTime?: string | null;
  };
  uid: string;
};

type HarnessProps = {
  devBypassEnabled?: boolean;
  hostedFlowEnabled?: boolean;
  sharedAuthAdapter?: SharedAuthAdapter<MockAuthUser> | null;
  sharedRoomOwnershipStore?: SharedRoomOwnershipStore | null;
  sharedRoomStore: SharedRoomStore;
};

let latestHookValue: HookValue | null = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function HookHarness({
  devBypassEnabled = false,
  hostedFlowEnabled,
  sharedAuthAdapter,
  sharedRoomOwnershipStore,
  sharedRoomStore
}: HarnessProps) {
  const devBootstrapRoomState = useMemo(() => createDefaultRoomState(), []);

  latestHookValue = useSharedRoomRuntime({
    devBypassEnabled,
    devBootstrapRoomState,
    devBootstrapSharedCoins: 120,
    hostedFlowEnabled,
    sharedAuthAdapter,
    sharedRoomOwnershipStore,
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

function seedRuntimeProfile(
  overrides: Partial<SharedPlayerProfile> = {}
): SharedPlayerProfile {
  const profile = createProfile(overrides);
  saveSharedPlayerProfile(profile);
  return profile;
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

function createAuthUser(
  overrides: Partial<MockAuthUser> = {}
): MockAuthUser {
  return {
    uid: overrides.uid ?? "firebase-user-1",
    displayName: overrides.displayName ?? "Ari",
    email: overrides.email ?? "ari@example.com",
    metadata: {
      creationTime:
        overrides.metadata?.creationTime ?? "2026-03-26T00:00:00.000Z",
      lastSignInTime:
        overrides.metadata?.lastSignInTime ?? "2026-03-27T00:00:00.000Z"
    }
  };
}

function createSharedAuthHarness(initialUser: MockAuthUser | null) {
  let currentUser = initialUser;
  const subscribers = new Set<(user: MockAuthUser | null) => void>();

  const sharedAuthAdapter: SharedAuthAdapter<MockAuthUser> = {
    signInWithGoogle: vi.fn(async () => currentUser),
    signOut: vi.fn(async () => {
      currentUser = null;

      for (const callback of subscribers) {
        callback(null);
      }
    }),
    subscribe(callback) {
      subscribers.add(callback);
      callback(currentUser);

      return () => {
        subscribers.delete(callback);
      };
    },
    toSharedPlayerProfile(user) {
      return {
        playerId: user.uid,
        displayName: user.displayName ?? "Player",
        createdAt: user.metadata.creationTime ?? "2026-03-26T00:00:00.000Z",
        updatedAt: user.metadata.lastSignInTime ?? "2026-03-27T00:00:00.000Z"
      };
    }
  };

  return {
    sharedAuthAdapter,
    setUser(nextUser: MockAuthUser | null) {
      currentUser = nextUser;

      for (const callback of subscribers) {
        callback(nextUser);
      }
    }
  };
}

async function flushHookEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("shared room runtime helpers", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    window.localStorage.clear();
    latestHookValue = null;
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

  it("loads the canonical room from a persisted shared session", async () => {
    const profile = seedRuntimeProfile({
      playerId: "firebase-user-1"
    });
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const loadSharedRoom = vi.fn().mockResolvedValue(roomDocument);
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom,
      commitSharedRoomState: vi.fn()
    };

    saveSharedRoomSession({
      playerId: profile.playerId,
      partnerId: "player-2",
      roomId: roomDocument.roomId,
      inviteCode: roomDocument.inviteCode,
      lastKnownRevision: 2
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedRoomStore }));
    });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(1);
    expect(loadSharedRoom).toHaveBeenCalledWith({ roomId: roomDocument.roomId });
    expect(latestHookValue?.runtimeSnapshot?.roomId).toBe(roomDocument.roomId);
    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(roomDocument.revision);
    expect(
      latestHookValue?.runtimeSnapshot?.progression.players[profile.playerId]?.coins
    ).toBe(70);
    expect(latestHookValue?.session?.lastKnownRevision).toBe(roomDocument.revision);
    expect(latestHookValue?.blockingState).toBeNull();
  });

  it("creates a runtime snapshot with canonical progression", () => {
    const roomDocument = createSharedRoomDocument("player-1", {
      frameMemories: {
        "starter-wall-frame": {
          furnitureId: "starter-wall-frame",
          imageSrc: "data:image/jpeg;base64,abc",
          caption: "Together",
          updatedAt: "2026-03-26T00:01:30.000Z",
          updatedByPlayerId: "player-1"
        }
      },
      sharedPet: createSharedRoomPetRecord(
        [0.5, 0, 1.25],
        "player-1",
        "2026-03-26T00:01:30.000Z"
      )
    });
    const runtimeSnapshot = createSharedRoomRuntimeSnapshot(roomDocument);

    expect(runtimeSnapshot.progression.players["player-1"]).toMatchObject({
      coins: 70,
      level: 1,
      xp: 0
    });
    expect(runtimeSnapshot.members).toHaveLength(2);
    expect(runtimeSnapshot.frameMemories["starter-wall-frame"]).toMatchObject({
      caption: "Together"
    });
    expect(runtimeSnapshot.sharedPet).toMatchObject({
      type: "minecraft_cat"
    });
  });

  it("reconnect reload discards unconfirmed local edits by adopting the canonical room", () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const localDraftSnapshot = createSharedRoomRuntimeSnapshot(roomDocument);

    localDraftSnapshot.roomState.metadata.roomTheme = "draft-theme";
    localDraftSnapshot.roomState.furniture = [];

    const canonicalReloadSnapshot = createSharedRoomRuntimeSnapshot(roomDocument);

    expect(canonicalReloadSnapshot.roomState.metadata.roomTheme).toBe("starter-cozy");
    expect(canonicalReloadSnapshot.roomState.furniture).toHaveLength(
      roomDocument.roomState.furniture.length
    );
    expect(roomDocument.roomState.furniture).not.toHaveLength(0);
  });

  it("commits only confirmed room changes", () => {
    expect(shouldCommitSharedRoomChange("snapshot")).toBe(false);
    expect(shouldCommitSharedRoomChange("committed")).toBe(true);
  });

  it("auto-enters the dev shared room", async () => {
    const profile = seedRuntimeProfile({
      playerId: "firebase-user-1"
    });
    const roomDocument = createSharedRoomDocument(profile.playerId, {
      roomId: "dev-shared-room",
      inviteCode: "DEVROOM",
      memberIds: [profile.playerId],
      members: [
        {
          playerId: profile.playerId,
          displayName: profile.displayName,
          role: "creator",
          joinedAt: profile.createdAt
        }
      ],
      progression: createInitialSharedRoomProgression(
        [profile.playerId],
        [
          {
            playerId: profile.playerId,
            displayName: profile.displayName,
            role: "creator",
            joinedAt: profile.createdAt
          }
        ],
        120,
        profile.createdAt
      )
    });
    const bootstrapDevSharedRoom = vi.fn().mockResolvedValue(roomDocument);
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom,
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom: vi.fn(),
      commitSharedRoomState: vi.fn()
    };

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          devBypassEnabled: true,
          sharedRoomStore
        })
      );
    });
    await flushHookEffects();

    expect(bootstrapDevSharedRoom).toHaveBeenCalledTimes(1);
    expect(bootstrapDevSharedRoom).toHaveBeenCalledWith({
      profile: expect.objectContaining({
        playerId: profile.playerId
      }),
      sharedCoins: 120,
      sourceRoomState: expect.objectContaining({
        metadata: expect.objectContaining({
          roomId: "local-sandbox-room"
        })
      })
    });
    expect(latestHookValue?.devBypassActive).toBe(true);
    expect(latestHookValue?.entryMode).toBe("dev_fallback");
    expect(latestHookValue?.runtimeSnapshot?.roomId).toBe("dev-shared-room");
    expect(latestHookValue?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(
      120
    );
  });

  it("blocks in a hosted-unavailable state instead of silently entering the dev room", async () => {
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom: vi.fn(),
      commitSharedRoomState: vi.fn()
    };

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          devBypassEnabled: true,
          hostedFlowEnabled: true,
          sharedAuthAdapter: null,
          sharedRoomOwnershipStore: null,
          sharedRoomStore
        })
      );
    });
    await flushHookEffects();

    expect(latestHookValue?.entryMode).toBe("hosted_unavailable");
    expect(latestHookValue?.bootstrapKind).toBe("hosted_unavailable");
    expect(latestHookValue?.devBypassActive).toBe(false);
    expect(latestHookValue?.runtimeSnapshot).toBeNull();
    expect(latestHookValue?.hostedUnavailableBody).toContain("hosted");
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

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          hostedFlowEnabled: true,
          sharedAuthAdapter: authHarness.sharedAuthAdapter,
          sharedRoomOwnershipStore: ownershipStore,
          sharedRoomStore: roomStore
        })
      );
    });
    await flushHookEffects();

    expect(latestHookValue?.entryMode).toBe("hosted");
    expect(latestHookValue?.bootstrapKind).toBe("room_ready");
    expect(latestHookValue?.runtimeSnapshot?.roomId).toBe(
      database.roomMemberships[ari.playerId]?.roomId
    );
    expect(latestHookValue?.session?.playerId).toBe(ari.playerId);
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

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          hostedFlowEnabled: true,
          sharedAuthAdapter: authHarness.sharedAuthAdapter,
          sharedRoomOwnershipStore: ownershipStore,
          sharedRoomStore: roomStore
        })
      );
    });
    await flushHookEffects();

    expect(latestHookValue?.bootstrapKind).toBe("needs_linking");
    expect(latestHookValue?.selfPairCode).toMatch(/[A-Z0-9]{8}/);
    expect(latestHookValue?.runtimeSnapshot).toBeNull();
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

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          hostedFlowEnabled: true,
          sharedAuthAdapter: authHarness.sharedAuthAdapter,
          sharedRoomOwnershipStore: ownershipStore,
          sharedRoomStore: roomStore
        })
      );
    });
    await flushHookEffects();

    await act(async () => {
      await latestHookValue?.signOut();
    });
    await flushHookEffects();

    expect(latestHookValue?.bootstrapKind).toBe("signed_out");
    expect(latestHookValue?.runtimeSnapshot).toBeNull();
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

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          hostedFlowEnabled: true,
          sharedAuthAdapter: authHarness.sharedAuthAdapter,
          sharedRoomOwnershipStore: ownershipStore,
          sharedRoomStore: roomStore
        })
      );
    });
    await flushHookEffects();

    expect(latestHookValue?.bootstrapKind).toBe("room_ready");
    expect(latestHookValue?.runtimeSnapshot?.memberIds).toEqual(
      expect.arrayContaining([ari.playerId, bea.playerId])
    );
    expect(latestHookValue?.session?.partnerId).toBe(ari.playerId);
  });

  it("refreshes a passive room snapshot when the shared cat is adopted canonically", async () => {
    vi.useFakeTimers();
    const profile = seedRuntimeProfile({
      playerId: "firebase-user-1"
    });
    const initialRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 1,
      sharedPet: null
    });
    const adoptedRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 2,
      sharedPet: createSharedRoomPetRecord(
        [0.5, 0, 1.5],
        "player-2",
        "2026-03-26T00:02:00.000Z"
      )
    });
    const loadSharedRoom = vi
      .fn<SharedRoomStore["loadSharedRoom"]>()
      .mockResolvedValueOnce(initialRoomDocument)
      .mockResolvedValue(adoptedRoomDocument);
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom,
      commitSharedRoomState: vi.fn()
    };

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

    expect(latestHookValue?.runtimeSnapshot?.sharedPet).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(2);
    expect(latestHookValue?.runtimeSnapshot?.sharedPet).toMatchObject({
      id: "shared-pet-minecraft_cat"
    });
    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(2);
  });

  it("creates a session from the canonical room document", () => {
    const roomDocument = createSharedRoomDocument("player-1");

    expect(createSharedRoomSessionFromDocument("player-1", roomDocument)).toEqual({
      playerId: "player-1",
      partnerId: "player-2",
      roomId: roomDocument.roomId,
      inviteCode: roomDocument.inviteCode,
      lastKnownRevision: roomDocument.revision
    });
  });

  it("commits desk pc progression and ritual state through the shared room runtime", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const commitSharedRoomState = vi.fn().mockImplementation(async (input) => ({
      ...roomDocument,
      revision: roomDocument.revision + 1,
      progression: input.progression,
      roomState: input.roomState,
      updatedAt: "2026-03-26T02:00:00.000Z"
    }));
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom: vi.fn().mockResolvedValue(roomDocument),
      commitSharedRoomState
    };

    saveSharedPlayerProfile(profile);
    saveSharedRoomSession({
      playerId: profile.playerId,
      partnerId: "player-2",
      roomId: roomDocument.roomId,
      inviteCode: roomDocument.inviteCode,
      lastKnownRevision: roomDocument.revision
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedRoomStore }));
    });
    await flushHookEffects();

    await act(async () => {
      await latestHookValue?.commitRoomMutation("pc_minigame_reward", (snapshot) => {
        const nextProgression = applyDeskPcCompletionToProgression({
          progression: snapshot.progression,
          actorPlayerId: profile.playerId,
          result: {
            score: 11,
            rewardCoins: 8,
            completedAt: Date.parse("2026-03-26T02:00:00.000Z")
          },
          memberIds: snapshot.memberIds,
          nowIso: "2026-03-26T02:00:00.000Z"
        });

        return {
          roomState: snapshot.roomState,
          progression: nextProgression.progression,
          frameMemories: snapshot.frameMemories,
          sharedPet: snapshot.sharedPet
        };
      });
    });
    await flushHookEffects();

    expect(commitSharedRoomState).toHaveBeenCalledTimes(1);
    expect(commitSharedRoomState).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRevision: roomDocument.revision,
        reason: "pc_minigame_reward"
      })
    );
    expect(latestHookValue?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(78);
    expect(
      latestHookValue?.runtimeSnapshot?.progression.couple.ritual.completionsByPlayerId[
        profile.playerId
      ]
    ).toMatchObject({
      source: "desk_pc"
    });
  });

  it("replays a progression mutation after a stale revision conflict", async () => {
    const profile = createProfile();
    const initialRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 3
    });
    const latestRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 4
    });
    const replayResult = applyDeskPcCompletionToProgression({
      progression: latestRoomDocument.progression,
      actorPlayerId: profile.playerId,
      result: {
        score: 15,
        rewardCoins: 9,
        completedAt: Date.parse("2026-03-26T03:00:00.000Z")
      },
      memberIds: latestRoomDocument.memberIds,
      nowIso: "2026-03-26T03:00:00.000Z"
    });
    const loadSharedRoom = vi
      .fn<SharedRoomStore["loadSharedRoom"]>()
      .mockResolvedValueOnce(initialRoomDocument)
      .mockResolvedValueOnce(latestRoomDocument);
    const commitSharedRoomState = vi
      .fn<SharedRoomStore["commitSharedRoomState"]>()
      .mockRejectedValueOnce(new SharedRoomClientError("Shared room revision conflict.", 409))
      .mockResolvedValueOnce({
        ...latestRoomDocument,
        revision: 5,
        progression: replayResult.progression,
        updatedAt: "2026-03-26T03:00:00.000Z"
      });
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom,
      commitSharedRoomState
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

    await act(async () => {
      await latestHookValue?.commitRoomMutation("pc_minigame_reward", (snapshot) => {
        const nextProgression = applyDeskPcCompletionToProgression({
          progression: snapshot.progression,
          actorPlayerId: profile.playerId,
          result: {
            score: 15,
            rewardCoins: 9,
            completedAt: Date.parse("2026-03-26T03:00:00.000Z")
          },
          memberIds: snapshot.memberIds,
          nowIso: "2026-03-26T03:00:00.000Z"
        });

        return {
          roomState: snapshot.roomState,
          progression: nextProgression.progression,
          frameMemories: snapshot.frameMemories,
          sharedPet: snapshot.sharedPet
        };
      });
    });
    await flushHookEffects();

    expect(commitSharedRoomState).toHaveBeenCalledTimes(2);
    expect(loadSharedRoom).toHaveBeenCalledTimes(2);
    expect(latestHookValue?.statusMessage).toBe("Shared room updated");
    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(5);
    expect(latestHookValue?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(79);
  });

  it("hydrates the same partial ritual progress after reload", async () => {
    const profile = createProfile();
    const nowIso = new Date().toISOString();
    const partialProgression = applyDeskPcCompletionToProgression({
      progression: createSharedRoomDocument(profile.playerId, {
        updatedAt: nowIso
      }).progression,
      actorPlayerId: profile.playerId,
      result: {
        score: 10,
        rewardCoins: 8,
        completedAt: Date.parse(nowIso)
      },
      memberIds: ["player-1", "player-2"],
      nowIso
    }).progression;
    const roomDocument = createSharedRoomDocument(profile.playerId, {
      progression: partialProgression,
      updatedAt: nowIso
    });
    const loadSharedRoom = vi
      .fn<SharedRoomStore["loadSharedRoom"]>()
      .mockResolvedValue(roomDocument);
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
      roomId: roomDocument.roomId,
      inviteCode: roomDocument.inviteCode,
      lastKnownRevision: roomDocument.revision
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedRoomStore }));
    });
    await flushHookEffects();

    await act(async () => {
      await latestHookValue?.reloadRoom();
    });
    await flushHookEffects();

    expect(
      latestHookValue?.runtimeSnapshot?.progression.couple.ritual.completionsByPlayerId[
        profile.playerId
      ]
    ).toMatchObject({
      source: "desk_pc"
    });
    expect(latestHookValue?.runtimeSnapshot?.progression.couple.ritual.completedAt).toBeNull();
  });

  it("replays breakup reset after a stale revision conflict", async () => {
    const profile = createProfile();
    const initialRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 3,
      frameMemories: {
        "starter-wall-frame": {
          furnitureId: "starter-wall-frame",
          imageSrc: "data:image/jpeg;base64,abc",
          caption: "Before",
          updatedAt: "2026-03-26T05:00:00.000Z",
          updatedByPlayerId: profile.playerId
        }
      },
      sharedPet: createSharedRoomPetRecord(
        [0.5, 0, 1.5],
        profile.playerId,
        "2026-03-26T05:00:00.000Z"
      )
    });
    const latestRoomDocument = createSharedRoomDocument(profile.playerId, {
      revision: 4,
      frameMemories: {
        "starter-wall-frame": {
          furnitureId: "starter-wall-frame",
          imageSrc: "data:image/jpeg;base64,def",
          caption: "Latest",
          updatedAt: "2026-03-26T05:05:00.000Z",
          updatedByPlayerId: "player-2"
        }
      },
      sharedPet: createSharedRoomPetRecord(
        [1.25, 0, -0.5],
        "player-2",
        "2026-03-26T05:05:00.000Z"
      )
    });
    const resetMutation = createBreakupResetMutation(
      latestRoomDocument,
      profile.playerId,
      "2026-03-26T05:10:00.000Z"
    );
    const loadSharedRoom = vi
      .fn<SharedRoomStore["loadSharedRoom"]>()
      .mockResolvedValueOnce(initialRoomDocument)
      .mockResolvedValueOnce(latestRoomDocument);
    const commitSharedRoomState = vi
      .fn<SharedRoomStore["commitSharedRoomState"]>()
      .mockRejectedValueOnce(new SharedRoomClientError("Shared room revision conflict.", 409))
      .mockResolvedValueOnce({
        ...latestRoomDocument,
        ...resetMutation,
        revision: 5,
        updatedAt: "2026-03-26T05:10:00.000Z"
      });
    const sharedRoomStore: SharedRoomStore = {
      bootstrapDevSharedRoom: vi.fn(),
      createSharedRoom: vi.fn(),
      joinSharedRoom: vi.fn(),
      loadSharedRoom,
      commitSharedRoomState
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

    await act(async () => {
      await latestHookValue?.commitRoomMutation("breakup_reset", (snapshot) =>
        createBreakupResetMutation(
          snapshot,
          profile.playerId,
          "2026-03-26T05:10:00.000Z"
        )
      );
    });
    await flushHookEffects();

    expect(commitSharedRoomState).toHaveBeenCalledTimes(2);
    expect(latestHookValue?.runtimeSnapshot?.revision).toBe(5);
    expect(latestHookValue?.runtimeSnapshot?.roomId).toBe(initialRoomDocument.roomId);
    expect(latestHookValue?.runtimeSnapshot?.frameMemories).toEqual({});
    expect(latestHookValue?.runtimeSnapshot?.sharedPet).toBeNull();
  });
});
