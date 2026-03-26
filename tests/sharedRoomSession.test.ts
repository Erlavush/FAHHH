import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSharedRoomSession,
  loadOrCreateSharedPlayerProfile,
  loadSharedRoomSession,
  saveSharedRoomSession
} from "../src/lib/sharedRoomSession";

describe("sharedRoomSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reuses the same playerId across profile reloads", () => {
    const initialProfile = loadOrCreateSharedPlayerProfile("Ari");
    const reloadedProfile = loadOrCreateSharedPlayerProfile("Ari");

    expect(reloadedProfile.playerId).toBe(initialProfile.playerId);
    expect(reloadedProfile.displayName).toBe("Ari");
  });

  it("overwrites the previous session when a new one is saved", () => {
    saveSharedRoomSession({
      playerId: "player-1",
      partnerId: "player-2",
      roomId: "room-1",
      inviteCode: "ABCD12",
      lastKnownRevision: 1
    });

    saveSharedRoomSession({
      playerId: "player-1",
      partnerId: "player-3",
      roomId: "room-2",
      inviteCode: "WXYZ34",
      lastKnownRevision: 4
    });

    expect(loadSharedRoomSession()).toEqual({
      playerId: "player-1",
      partnerId: "player-3",
      roomId: "room-2",
      inviteCode: "WXYZ34",
      lastKnownRevision: 4
    });
  });

  it("clears the stored session cleanly", () => {
    saveSharedRoomSession({
      playerId: "player-1",
      partnerId: "player-2",
      roomId: "room-1",
      inviteCode: "ABCD12",
      lastKnownRevision: 1
    });

    clearSharedRoomSession();

    expect(loadSharedRoomSession()).toBeNull();
  });
});
