// @vitest-environment jsdom

import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSharedRoomRuntimeSnapshot,
  createSharedRoomSessionFromDocument,
  shouldCommitSharedRoomChange,
  useSharedRoomRuntime
} from "../src/app/hooks/useSharedRoomRuntime";
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

  roomState.metadata.roomId = roomId;

  return {
    roomId,
    inviteCode: overrides.inviteCode ?? "ABC123",
    memberIds: overrides.memberIds ?? [playerId, "player-2"],
    members: overrides.members ?? [
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
    ],
    revision: overrides.revision ?? 3,
    sharedCoins: overrides.sharedCoins ?? 140,
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
    expect(latestHookValue?.session?.lastKnownRevision).toBe(roomDocument.revision);
    expect(latestHookValue?.blockingState).toBeNull();
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
      ]
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
});
