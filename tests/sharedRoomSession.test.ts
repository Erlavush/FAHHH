import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSharedRoomSession,
  loadOrCreateSharedPlayerProfile,
  loadSharedRoomSession,
  saveSharedPlayerProfile,
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

  it("hydrates the shared profile from a canonical auth id", () => {
    const hydratedProfile = loadOrCreateSharedPlayerProfile("Ari", {
      canonicalPlayerId: "firebase-user-1"
    });
    const reloadedProfile = loadOrCreateSharedPlayerProfile("Ari", {
      canonicalPlayerId: "firebase-user-1"
    });

    expect(hydratedProfile.playerId).toBe("firebase-user-1");
    expect(reloadedProfile.playerId).toBe("firebase-user-1");
    expect(reloadedProfile.displayName).toBe("Ari");
  });

  it("keeps the cached display name when auth later provides the canonical id", () => {
    const cachedProfile = loadOrCreateSharedPlayerProfile("Ari");
    const authProfile = loadOrCreateSharedPlayerProfile("", {
      canonicalPlayerId: "firebase-user-1"
    });

    expect(cachedProfile.playerId).not.toBe("firebase-user-1");
    expect(authProfile.playerId).toBe("firebase-user-1");
    expect(authProfile.displayName).toBe("Ari");
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

  it("clears the stored session cleanly without changing the auth-derived profile", () => {
    saveSharedPlayerProfile({
      playerId: "firebase-user-1",
      displayName: "Ari",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T01:00:00.000Z"
    });
    saveSharedRoomSession({
      playerId: "firebase-user-1",
      partnerId: "player-2",
      roomId: "room-1",
      inviteCode: "ABCD12",
      lastKnownRevision: 1
    });

    clearSharedRoomSession();

    expect(loadSharedRoomSession()).toBeNull();
    expect(
      loadOrCreateSharedPlayerProfile("Ari", {
        canonicalPlayerId: "firebase-user-1"
      })
    ).toMatchObject({
      playerId: "firebase-user-1",
      displayName: "Ari"
    });
  });
});
