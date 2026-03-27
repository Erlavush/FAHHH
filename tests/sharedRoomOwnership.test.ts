import { describe, expect, it } from "vitest";
import {
  assertPairLinkSubmissionAllowed,
  deriveSharedRoomBootstrapState,
  isPendingPairLinkReady,
  normalizePairCode,
  rejectInvalidPairParticipants
} from "../src/lib/sharedRoomOwnership";
import type {
  SharedPendingPairLink,
  SharedRoomMembership
} from "../src/lib/sharedRoomTypes";

function createPendingLink(
  overrides: Partial<SharedPendingPairLink> = {}
): SharedPendingPairLink {
  return {
    pendingLinkId: overrides.pendingLinkId ?? "pending:player-1:player-2",
    playerIds: overrides.playerIds ?? ["player-1", "player-2"],
    submittedByPlayerId: overrides.submittedByPlayerId ?? "player-1",
    targetPairCode: overrides.targetPairCode ?? "ABCD12",
    confirmationsByPlayerId: overrides.confirmationsByPlayerId ?? {
      "player-1": true,
      "player-2": false
    },
    expiresAt: overrides.expiresAt ?? "2026-03-27T01:00:00.000Z",
    playerDisplayNamesById: overrides.playerDisplayNamesById ?? {
      "player-1": "Ari",
      "player-2": "Bea"
    }
  };
}

function createMembership(
  overrides: Partial<SharedRoomMembership> = {}
): SharedRoomMembership {
  return {
    playerId: overrides.playerId ?? "player-1",
    roomId: overrides.roomId ?? "room-1",
    partnerPlayerId: overrides.partnerPlayerId ?? "player-2",
    pairCode: overrides.pairCode ?? "ABCD12",
    pairedAt: overrides.pairedAt ?? "2026-03-27T00:00:00.000Z"
  };
}

describe("sharedRoomOwnership", () => {
  it("rejects a third member or already-paired account", () => {
    expect(() =>
      rejectInvalidPairParticipants(["player-1", "player-2", "player-3"])
    ).toThrow("Only two players can belong to one couple room.");

    expect(() =>
      assertPairLinkSubmissionAllowed({
        actorPlayerId: "player-1",
        targetPlayerId: "player-2",
        actorMembership: createMembership()
      })
    ).toThrow("Already paired accounts cannot start a new couple room link.");
  });

  it("normalizes pair codes and rejects self-linking", () => {
    expect(normalizePairCode(" ab-cd 12 ")).toBe("ABCD12");
    expect(() =>
      rejectInvalidPairParticipants(["player-1", "player-1"])
    ).toThrow("Pair link requires two different players.");
  });

  it("becomes ready only when both players confirm before expiry", () => {
    const pendingLink = createPendingLink();

    expect(
      isPendingPairLinkReady(pendingLink, "2026-03-27T00:30:00.000Z")
    ).toBe(false);
    expect(
      isPendingPairLinkReady(
        {
          ...pendingLink,
          confirmationsByPlayerId: {
            "player-1": true,
            "player-2": true
          }
        },
        "2026-03-27T00:30:00.000Z"
      )
    ).toBe(true);
    expect(
      isPendingPairLinkReady(
        {
          ...pendingLink,
          confirmationsByPlayerId: {
            "player-1": true,
            "player-2": true
          }
        },
        "2026-03-27T01:00:01.000Z"
      )
    ).toBe(false);
  });

  it("derives bootstrap state from needs-linking, pending-link, and paired-room inputs", () => {
    const needsLinking = deriveSharedRoomBootstrapState({
      playerId: "player-1",
      selfPairCode: "ABCD12"
    });
    const pendingLink = deriveSharedRoomBootstrapState({
      playerId: "player-1",
      selfPairCode: "ABCD12",
      pendingLink: createPendingLink()
    });
    const pairedRoom = deriveSharedRoomBootstrapState({
      playerId: "player-1",
      selfPairCode: "ABCD12",
      membership: createMembership()
    });

    expect(needsLinking.kind).toBe("needs_linking");
    expect(pendingLink.kind).toBe("pending_link");
    expect(pendingLink.pendingLink.playerDisplayNamesById?.["player-2"]).toBe("Bea");
    expect(pairedRoom.kind).toBe("paired_room");
    expect(pairedRoom.membership.roomId).toBe("room-1");
  });
});
