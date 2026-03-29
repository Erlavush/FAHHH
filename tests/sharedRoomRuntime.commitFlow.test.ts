// @vitest-environment jsdom

import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyDeskPcCompletionToProgression,
  applySharedActivityCompletionToProgression
} from "../src/lib/sharedProgression";
import { SharedRoomClientError } from "../src/lib/sharedRoomClient";
import { createSharedRoomPetRecord } from "../src/lib/sharedRoomPet";
import { createBreakupResetMutation } from "../src/lib/sharedRoomReset";
import {
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../src/lib/sharedRoomSession";
import type { SharedRoomStore } from "../src/lib/sharedRoomStore";
import {
  cleanupHookHarness,
  createProfile,
  createSharedRoomDocument,
  flushHookEffects,
  getLatestHookValue,
  mountHookHarness,
  prepareSharedRoomRuntimeTest
} from "./sharedRoomRuntime.fixtures";

describe("shared room runtime commit flow", () => {
  beforeEach(() => {
    prepareSharedRoomRuntimeTest();
  });

  afterEach(async () => {
    await cleanupHookHarness();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("routes recoverFromStaleSharedEdit through reloadRoom", async () => {
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.recoverFromStaleSharedEdit();
    });
    await flushHookEffects();

    expect(loadSharedRoom).toHaveBeenCalledTimes(2);
    expect(getLatestHookValue()?.runtimeSnapshot?.revision).toBe(4);
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("pc_minigame_reward", (snapshot) => {
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
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(78);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.ritual.completionsByPlayerId[
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("pc_minigame_reward", (snapshot) => {
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
    expect(getLatestHookValue()?.statusMessage).toBe("Shared room updated");
    expect(getLatestHookValue()?.runtimeSnapshot?.revision).toBe(5);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(79);
  });

  it("pays each desk app once per room day for the active player", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const commitSharedRoomState = vi.fn().mockImplementation(async (input) => ({
      ...roomDocument,
      revision: roomDocument.revision + commitSharedRoomState.mock.calls.length,
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    const runs = [
      { activityId: "pc_snake" as const, rewardCoins: 8, score: 11 },
      { activityId: "pc_block_stacker" as const, rewardCoins: 9, score: 15 },
      { activityId: "pc_pacman" as const, rewardCoins: 7, score: 13 }
    ];

    for (const run of runs) {
      await act(async () => {
        await getLatestHookValue()?.commitRoomMutation(`pc_game_reward:${run.activityId}`, (snapshot) => {
          const nextProgression = applySharedActivityCompletionToProgression({
            progression: snapshot.progression,
            activityId: run.activityId,
            claimMode: "per_player",
            actorPlayerId: profile.playerId,
            memberIds: snapshot.memberIds,
            rewardCoins: run.rewardCoins,
            rewardXp: run.rewardCoins + 4,
            score: run.score,
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
    }

    expect(commitSharedRoomState.mock.calls.map((call) => call[0].reason)).toEqual([
      "pc_game_reward:pc_snake",
      "pc_game_reward:pc_block_stacker",
      "pc_game_reward:pc_pacman"
    ]);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(94);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.pc_snake?.perPlayerClaimsByPlayerId[profile.playerId]?.rewardCoins
    ).toBe(8);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.pc_block_stacker?.perPlayerClaimsByPlayerId[profile.playerId]?.rewardCoins
    ).toBe(9);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.pc_pacman?.perPlayerClaimsByPlayerId[profile.playerId]?.rewardCoins
    ).toBe(7);
  });

  it("does not pay the same desk app twice in one room day", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const commitSharedRoomState = vi.fn().mockImplementation(async (input) => ({
      ...roomDocument,
      revision: roomDocument.revision + commitSharedRoomState.mock.calls.length,
      progression: input.progression,
      roomState: input.roomState,
      updatedAt: "2026-03-26T03:00:00.000Z"
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("pc_game_reward:pc_snake", (snapshot) => {
        const nextProgression = applySharedActivityCompletionToProgression({
          progression: snapshot.progression,
          activityId: "pc_snake",
          claimMode: "per_player",
          actorPlayerId: profile.playerId,
          memberIds: snapshot.memberIds,
          rewardCoins: 8,
          rewardXp: 12,
          score: 11,
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

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("pc_game_reward:pc_snake", (snapshot) => {
        const nextProgression = applySharedActivityCompletionToProgression({
          progression: snapshot.progression,
          activityId: "pc_snake",
          claimMode: "per_player",
          actorPlayerId: profile.playerId,
          memberIds: snapshot.memberIds,
          rewardCoins: 10,
          rewardXp: 14,
          score: 17,
          nowIso: "2026-03-26T03:10:00.000Z"
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

    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(78);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.deskPc.appsByActivityId?.pc_snake
        ?.gamesPlayed
    ).toBe(2);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.deskPc.appsByActivityId?.pc_snake
        ?.lastScore
    ).toBe(17);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.deskPc.appsByActivityId?.pc_snake
        ?.lastRewardCoins
    ).toBe(0);
  });

  it("keeps desk app claim state after reload", async () => {
    const profile = createProfile();
    const nowIso = "2026-03-26T04:00:00.000Z";
    const paidProgression = applySharedActivityCompletionToProgression({
      progression: createSharedRoomDocument(profile.playerId, {
        updatedAt: nowIso
      }).progression,
      activityId: "pc_block_stacker",
      claimMode: "per_player",
      actorPlayerId: profile.playerId,
      memberIds: ["player-1", "player-2"],
      rewardCoins: 9,
      rewardXp: 13,
      score: 15,
      nowIso
    }).progression;
    const roomDocument = createSharedRoomDocument(profile.playerId, {
      progression: paidProgression,
      updatedAt: nowIso
    });
    const loadSharedRoom = vi.fn<SharedRoomStore["loadSharedRoom"]>().mockResolvedValue(roomDocument);
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.reloadRoom();
    });
    await flushHookEffects();

    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.pc_block_stacker?.perPlayerClaimsByPlayerId[profile.playerId]?.rewardCoins
    ).toBe(9);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.deskPc.appsByActivityId
        ?.pc_block_stacker?.gamesPlayed
    ).toBe(1);
  });

  it("pays Cozy Rest once per room day for both partners", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const commitSharedRoomState = vi.fn().mockImplementation(async (input) => ({
      ...roomDocument,
      revision: roomDocument.revision + commitSharedRoomState.mock.calls.length,
      progression: input.progression,
      roomState: input.roomState,
      updatedAt: "2026-03-26T05:00:00.000Z"
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("cozy_rest_reward", (snapshot) => {
        const nextProgression = applySharedActivityCompletionToProgression({
          progression: snapshot.progression,
          activityId: "cozy_rest",
          claimMode: "couple",
          actorPlayerId: profile.playerId,
          memberIds: snapshot.memberIds,
          rewardCoins: 6,
          rewardXp: 10,
          score: 1,
          nowIso: "2026-03-26T05:00:00.000Z"
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

    expect(commitSharedRoomState).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "cozy_rest_reward"
      })
    );
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(76);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players["player-2"]?.coins).toBe(76);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.cozy_rest?.coupleClaim?.rewardCoins
    ).toBe(6);
  });

  it("does not pay Cozy Rest twice in one room day", async () => {
    const profile = createProfile();
    const roomDocument = createSharedRoomDocument(profile.playerId);
    const commitSharedRoomState = vi.fn().mockImplementation(async (input) => ({
      ...roomDocument,
      revision: roomDocument.revision + commitSharedRoomState.mock.calls.length,
      progression: input.progression,
      roomState: input.roomState,
      updatedAt: "2026-03-26T05:10:00.000Z"
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    for (const nowIso of ["2026-03-26T05:10:00.000Z", "2026-03-26T05:20:00.000Z"]) {
      await act(async () => {
        await getLatestHookValue()?.commitRoomMutation("cozy_rest_reward", (snapshot) => {
          const nextProgression = applySharedActivityCompletionToProgression({
            progression: snapshot.progression,
            activityId: "cozy_rest",
            claimMode: "couple",
            actorPlayerId: profile.playerId,
            memberIds: snapshot.memberIds,
            rewardCoins: 6,
            rewardXp: 10,
            score: 1,
            nowIso
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
    }

    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(76);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players["player-2"]?.coins).toBe(76);
    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.cozy_rest?.coupleClaim?.rewardCoins
    ).toBe(6);
  });

  it("keeps Cozy Rest claim state after reload", async () => {
    const profile = createProfile();
    const nowIso = "2026-03-26T05:30:00.000Z";
    const paidProgression = applySharedActivityCompletionToProgression({
      progression: createSharedRoomDocument(profile.playerId, {
        updatedAt: nowIso
      }).progression,
      activityId: "cozy_rest",
      claimMode: "couple",
      actorPlayerId: profile.playerId,
      memberIds: ["player-1", "player-2"],
      rewardCoins: 6,
      rewardXp: 10,
      score: 1,
      nowIso
    }).progression;
    const roomDocument = createSharedRoomDocument(profile.playerId, {
      progression: paidProgression,
      updatedAt: nowIso
    });
    const loadSharedRoom = vi.fn<SharedRoomStore["loadSharedRoom"]>().mockResolvedValue(roomDocument);
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.reloadRoom();
    });
    await flushHookEffects();

    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.activityClaimsByDayKey["2026-03-26"]
        ?.cozy_rest?.coupleClaim?.rewardCoins
    ).toBe(6);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players[profile.playerId]?.coins).toBe(76);
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.players["player-2"]?.coins).toBe(76);
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.reloadRoom();
    });
    await flushHookEffects();

    expect(
      getLatestHookValue()?.runtimeSnapshot?.progression.couple.ritual.completionsByPlayerId[
        profile.playerId
      ]
    ).toMatchObject({
      source: "desk_pc"
    });
    expect(getLatestHookValue()?.runtimeSnapshot?.progression.couple.ritual.completedAt).toBeNull();
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

    await mountHookHarness({ sharedRoomStore });
    await flushHookEffects();

    await act(async () => {
      await getLatestHookValue()?.commitRoomMutation("breakup_reset", (snapshot) =>
        createBreakupResetMutation(
          snapshot,
          profile.playerId,
          "2026-03-26T05:10:00.000Z"
        )
      );
    });
    await flushHookEffects();

    expect(commitSharedRoomState).toHaveBeenCalledTimes(2);
    expect(getLatestHookValue()?.runtimeSnapshot?.revision).toBe(5);
    expect(getLatestHookValue()?.runtimeSnapshot?.roomId).toBe(initialRoomDocument.roomId);
    expect(getLatestHookValue()?.runtimeSnapshot?.frameMemories).toEqual({});
    expect(getLatestHookValue()?.runtimeSnapshot?.sharedPet).toBeNull();
  });
});
