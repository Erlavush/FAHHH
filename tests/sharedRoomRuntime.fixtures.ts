// @vitest-environment jsdom

import { act, createElement, useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createInitialSharedRoomProgression } from "../src/lib/sharedProgression";
import { cloneRoomState, createDefaultRoomState } from "../src/lib/roomState";
import { saveSharedPlayerProfile } from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument
} from "../src/lib/sharedRoomTypes";
import {
  type SharedAuthAdapter,
  useSharedRoomRuntime
} from "../src/app/hooks/useSharedRoomRuntime";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

export type HookValue = ReturnType<typeof useSharedRoomRuntime>;

export type MockAuthUser = {
  displayName: string | null;
  email?: string | null;
  metadata: {
    creationTime?: string | null;
    lastSignInTime?: string | null;
  };
  uid: string;
};

export type HarnessProps = {
  devBypassEnabled?: boolean;
  hostedFlowEnabled?: boolean;
  sharedAuthAdapter?: SharedAuthAdapter<MockAuthUser> | null;
  sharedRoomOwnershipStore?: NonNullable<Parameters<typeof useSharedRoomRuntime>[0]>["sharedRoomOwnershipStore"];
  sharedRoomStore: SharedRoomStore;
};

let latestHookValue: HookValue | null = null;
let container: HTMLDivElement | null = null;
let root: Root | null = null;

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

export function prepareSharedRoomRuntimeTest(): void {
  window.localStorage.clear();
  latestHookValue = null;
}

export async function mountHookHarness(props: HarnessProps): Promise<void> {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(createElement(HookHarness, props));
  });
}

export async function cleanupHookHarness(): Promise<void> {
  if (root) {
    await act(async () => {
      root?.unmount();
    });
  }

  root = null;

  if (container) {
    container.remove();
  }

  container = null;
  latestHookValue = null;
}

export function getLatestHookValue(): HookValue | null {
  return latestHookValue;
}

export function createProfile(
  overrides: Partial<SharedPlayerProfile> = {}
): SharedPlayerProfile {
  return {
    playerId: overrides.playerId ?? "player-1",
    displayName: overrides.displayName ?? "Player One",
    createdAt: overrides.createdAt ?? "2026-03-26T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-26T00:00:00.000Z"
  };
}

export function seedRuntimeProfile(
  overrides: Partial<SharedPlayerProfile> = {}
): SharedPlayerProfile {
  const profile = createProfile(overrides);
  saveSharedPlayerProfile(profile);
  return profile;
}

export function createSharedRoomDocument(
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
    sharedPets: overrides.sharedPets ?? []
  };
}

export function createAuthUser(
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

export function createSharedAuthHarness(initialUser: MockAuthUser | null) {
  let currentUser = initialUser;
  const subscribers = new Set<(user: MockAuthUser | null) => void>();

  const sharedAuthAdapter: SharedAuthAdapter<MockAuthUser> = {
    signInWithGoogle: async () => currentUser,
    signOut: async () => {
      currentUser = null;

      for (const callback of subscribers) {
        callback(null);
      }
    },
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

export function createHostedStoreStub(overrides: Partial<SharedRoomStore> = {}): SharedRoomStore {
  return {
    bootstrapDevSharedRoom: async () => {
      throw new Error('bootstrapDevSharedRoom not implemented.');
    },
    createSharedRoom: async () => {
      throw new Error('createSharedRoom not implemented.');
    },
    joinSharedRoom: async () => {
      throw new Error('joinSharedRoom not implemented.');
    },
    loadSharedRoom: async () => {
      throw new Error('loadSharedRoom not implemented.');
    },
    commitSharedRoomState: async () => {
      throw new Error('commitSharedRoomState not implemented.');
    },
    ...overrides
  };
}

export async function flushHookEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}