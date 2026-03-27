// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedRoomPresence } from "../src/app/hooks/useSharedRoomPresence";
import type { SharedRoomRuntimeBootstrapKind } from "../src/app/hooks/useSharedRoomRuntime";
import type { LocalPlayerPresenceSnapshot } from "../src/app/types";
import type { SharedPresenceStore } from "../src/lib/sharedPresenceStore";
import type { SharedPlayerProfile } from "../src/lib/sharedRoomTypes";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

type HookValue = ReturnType<typeof useSharedRoomPresence>;

type HarnessProps = {
  bootstrapKind?: SharedRoomRuntimeBootstrapKind;
  enabled?: boolean;
  localPresence?: LocalPlayerPresenceSnapshot | null;
  pendingLinkId?: string | null;
  profile?: SharedPlayerProfile;
  roomId?: string | null;
  sharedPresenceStore: SharedPresenceStore;
};

let latestHookValue: HookValue | null = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

function createLocalPresence(): LocalPlayerPresenceSnapshot {
  return {
    position: [0, 0, 0],
    facingY: 0,
    activity: "idle",
    interactionPose: null
  };
}

function createRoomPresenceSnapshot(updatedAt: string) {
  return {
    roomId: "shared-room-1",
    updatedAt,
    presences: [
      {
        roomId: "shared-room-1",
        playerId: "player-2",
        displayName: "Player Two",
        skinSrc: null,
        position: [1, 0, -1] as [number, number, number],
        facingY: 1.2,
        activity: "walking" as const,
        pose: null,
        updatedAt
      }
    ]
  };
}

function createSharedPresenceStore(
  loadRoomPresence: SharedPresenceStore["loadRoomPresence"]
): SharedPresenceStore {
  return {
    acquireEditLock: vi.fn().mockResolvedValue({
      roomId: "shared-room-1",
      updatedAt: new Date(Date.now()).toISOString(),
      locks: []
    }),
    loadRoomLocks: vi.fn().mockResolvedValue({
      roomId: "shared-room-1",
      updatedAt: new Date(Date.now()).toISOString(),
      locks: []
    }),
    upsertPresence: vi.fn().mockImplementation(async ({ presence }) => presence),
    loadRoomPresence,
    leavePresence: vi.fn().mockResolvedValue({
      roomId: "shared-room-1",
      updatedAt: new Date(Date.now()).toISOString(),
      presences: []
    }),
    releaseEditLock: vi.fn().mockResolvedValue({
      roomId: "shared-room-1",
      updatedAt: new Date(Date.now()).toISOString(),
      locks: []
    }),
    renewEditLock: vi.fn().mockResolvedValue({
      roomId: "shared-room-1",
      updatedAt: new Date(Date.now()).toISOString(),
      locks: []
    }),
    upsertPairLinkPresence: vi.fn().mockResolvedValue({
      pendingLinkId: "pending:player-1:player-2",
      updatedAt: new Date(Date.now()).toISOString(),
      presences: []
    }),
    loadPairLinkPresence: vi.fn().mockResolvedValue({
      pendingLinkId: "pending:player-1:player-2",
      updatedAt: new Date(Date.now()).toISOString(),
      presences: []
    }),
    leavePairLinkPresence: vi.fn().mockResolvedValue({
      pendingLinkId: "pending:player-1:player-2",
      updatedAt: new Date(Date.now()).toISOString(),
      presences: []
    })
  };
}

function HookHarness({
  bootstrapKind,
  enabled = true,
  localPresence = createLocalPresence(),
  pendingLinkId = null,
  profile = createProfile(),
  roomId = "shared-room-1",
  sharedPresenceStore
}: HarnessProps) {
  latestHookValue = useSharedRoomPresence({
    enabled,
    bootstrapKind,
    localPresence,
    pendingLinkId,
    partnerId: "player-2",
    profile,
    roomId,
    sharedPresenceStore,
    skinSrc: null
  });
  return null;
}

async function flushHookEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("sharedRoomPresence UX", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00.000Z"));
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

  it("keeps the room usable while the partner reconnects", async () => {
    const stalePresenceUpdatedAt = new Date(Date.now() - 5000).toISOString();
    const sharedPresenceStore = createSharedPresenceStore(
      vi.fn().mockResolvedValue(createRoomPresenceSnapshot(stalePresenceUpdatedAt))
    );

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedPresenceStore }));
    });
    await flushHookEffects();

    expect(latestHookValue?.presenceStatus.title).toBe("Partner reconnecting");
    expect(latestHookValue?.presenceStatus.isBlocking).toBe(false);
  });

  it("derives status copy from presence freshness rather than room commit state", async () => {
    let remoteUpdatedAt = new Date(Date.now()).toISOString();
    const loadRoomPresence = vi
      .fn<SharedPresenceStore["loadRoomPresence"]>()
      .mockImplementation(async () => createRoomPresenceSnapshot(remoteUpdatedAt));
    const sharedPresenceStore = createSharedPresenceStore(loadRoomPresence);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(createElement(HookHarness, { sharedPresenceStore }));
    });
    await flushHookEffects();

    expect(latestHookValue?.presenceStatus.title).toBe("Partner joined");

    await act(async () => {
      vi.advanceTimersByTime(2200);
      await Promise.resolve();
    });
    await flushHookEffects();

    expect(latestHookValue?.presenceStatus.title).toBe("Together now");

    await act(async () => {
      remoteUpdatedAt = new Date(Date.now() - 5000).toISOString();
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await flushHookEffects();

    expect(latestHookValue?.presenceStatus.title).toBe("Partner reconnecting");
  });

  it("does not start room presence before the room is ready", async () => {
    const loadRoomPresence = vi.fn<SharedPresenceStore["loadRoomPresence"]>();
    const upsertPresence = vi.fn<SharedPresenceStore["upsertPresence"]>();
    const loadPairLinkPresence = vi
      .fn<SharedPresenceStore["loadPairLinkPresence"]>()
      .mockResolvedValue({
        pendingLinkId: "pending:player-1:player-2",
        updatedAt: new Date(Date.now()).toISOString(),
        presences: []
      });
    const upsertPairLinkPresence = vi
      .fn<SharedPresenceStore["upsertPairLinkPresence"]>()
      .mockResolvedValue({
        pendingLinkId: "pending:player-1:player-2",
        updatedAt: new Date(Date.now()).toISOString(),
        presences: []
      });
    const sharedPresenceStore: SharedPresenceStore = {
      ...createSharedPresenceStore(loadRoomPresence),
      upsertPresence,
      loadPairLinkPresence,
      upsertPairLinkPresence
    };

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        createElement(HookHarness, {
          bootstrapKind: "pending_link",
          pendingLinkId: "pending:player-1:player-2",
          roomId: "shared-room-1",
          sharedPresenceStore
        })
      );
    });
    await flushHookEffects();

    expect(loadRoomPresence).not.toHaveBeenCalled();
    expect(upsertPresence).not.toHaveBeenCalled();
    expect(loadPairLinkPresence).toHaveBeenCalled();
    expect(upsertPairLinkPresence).toHaveBeenCalled();
  });
});
