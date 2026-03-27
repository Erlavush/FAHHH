// @vitest-environment jsdom

import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialSharedRoomProgression } from "../src/lib/sharedProgression";
import {
  createSharedRoomRuntimeSnapshot,
  createSharedRoomSessionFromDocument,
  shouldCommitSharedRoomChange
} from "../src/app/hooks/useSharedRoomRuntime";
import { createSharedRoomPetRecord } from "../src/lib/sharedRoomPet";
import { saveSharedRoomSession } from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import {
  cleanupHookHarness,
  createProfile,
  createSharedRoomDocument,
  flushHookEffects,
  getLatestHookValue,
  mountHookHarness,
  prepareSharedRoomRuntimeTest,
  seedRuntimeProfile
} from "./sharedRoomRuntime.fixtures";

describe("shared room runtime bootstrap helpers", () => {
  beforeEach(() => {
    prepareSharedRoomRuntimeTest();
  });

  afterEach(async () => {
    await cleanupHookHarness();
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(1);
    expect(loadSharedRoom).toHaveBeenCalledWith({ roomId: roomDocument.roomId });
    expect(getLatestHookValue()?.runtimeSnapshot?.roomId).toBe(roomDocument.roomId);
    expect(getLatestHookValue()?.runtimeSnapshot?.revision).toBe(roomDocument.revision);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins
    ).toBe(70);
    expect(getLatestHookValue()?.session?.lastKnownRevision).toBe(roomDocument.revision);
    expect(getLatestHookValue()?.blockingState).toBeNull();
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

    await mountHookHarness({
      devBypassEnabled: true,
      sharedRoomStore
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
    expect(getLatestHookValue()?.devBypassActive).toBe(true);
    expect(getLatestHookValue()?.entryMode).toBe("dev_fallback");
    expect(getLatestHookValue()?.runtimeSnapshot?.roomId).toBe("dev-shared-room");
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(
      120
    );
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    expect(getLatestHookValue()?.runtimeSnapshot?.sharedPet).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(2);
    expect(getLatestHookValue()?.runtimeSnapshot?.sharedPet).toMatchObject({
      id: "shared-pet-minecraft_cat"
    });
    expect(getLatestHookValue()?.runtimeSnapshot?.revision).toBe(2);
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