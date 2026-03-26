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
  useSharedRoomRuntime
} from "../src/app/hooks/useSharedRoomRuntime";
import { SharedRoomClientError } from "../src/lib/sharedRoomClient";
import { cloneRoomState, createDefaultRoomState } from "../src/lib/roomState";
import {
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument
} from "../src/lib/sharedRoomTypes";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

type HookValue = ReturnType<typeof useSharedRoomRuntime>;

type HarnessProps = {
  devBypassEnabled?: boolean;
  sharedRoomStore: SharedRoomStore;
};

let latestHookValue: HookValue | null = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function HookHarness({ devBypassEnabled = false, sharedRoomStore }: HarnessProps) {
  const devBootstrapRoomState = useMemo(() => createDefaultRoomState(), []);

  latestHookValue = useSharedRoomRuntime({
    devBypassEnabled,
    devBootstrapRoomState,
    devBootstrapSharedCoins: 120,
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
    roomState: overrides.roomState ?? roomState
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
    vi.restoreAllMocks();
  });

  it("loads the canonical room from a persisted shared session", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const loadSharedRoom = vi.fn().mockResolvedValue(roomDocument);
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
    expect(latestHookValue?.runtimeSnapshot?.progression.players["player-1"]?.coins).toBe(70);
    expect(latestHookValue?.session?.lastKnownRevision).toBe(roomDocument.revision);
    expect(latestHookValue?.blockingState).toBeNull();
  });

  it("creates a runtime snapshot with canonical progression", () => {
    const roomDocument = createSharedRoomDocument("player-1");
    const runtimeSnapshot = createSharedRoomRuntimeSnapshot(roomDocument);

    expect(runtimeSnapshot.progression.players["player-1"]).toMatchObject({
      coins: 70,
      level: 1,
      xp: 0
    });
    expect(runtimeSnapshot.members).toHaveLength(2);
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
    const profile = createProfile();
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

    saveSharedPlayerProfile(profile);

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
    expect(latestHookValue?.runtimeSnapshot?.roomId).toBe("dev-shared-room");
    expect(latestHookValue?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(
      120
    );
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
          progression: nextProgression.progression
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
          progression: nextProgression.progression
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
    const partialProgression = applyDeskPcCompletionToProgression({
      progression: createSharedRoomDocument(profile.playerId).progression,
      actorPlayerId: profile.playerId,
      result: {
        score: 10,
        rewardCoins: 8,
        completedAt: Date.parse("2026-03-26T04:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T04:00:00.000Z"
    }).progression;
    const roomDocument = createSharedRoomDocument(profile.playerId, {
      progression: partialProgression
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
});
