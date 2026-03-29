import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
import { createInitialSharedRoomProgression } from "../src/lib/sharedProgression";
import { createBreakupResetMutation } from "../src/lib/sharedRoomReset";

describe("sharedRoomReset", () => {
  it("rebuilds a fresh baseline while keeping the same room identity", () => {
    const members = [
      {
        playerId: "player-1",
        displayName: "Ari",
        role: "creator" as const,
        joinedAt: "2026-03-26T13:00:00.000Z"
      },
      {
        playerId: "player-2",
        displayName: "Bea",
        role: "partner" as const,
        joinedAt: "2026-03-26T13:01:00.000Z"
      }
    ];
    const mutation = createBreakupResetMutation(
      {
        roomId: "shared-room-1",
        memberIds: ["player-1", "player-2"],
        members
      },
      "player-1",
      "2026-03-26T15:00:00.000Z"
    );

    expect(mutation.roomState.metadata.roomId).toBe("shared-room-1");
    expect(Object.keys(mutation.progression.players)).toEqual(["player-1", "player-2"]);
    expect(mutation.roomState.furniture).toHaveLength(createDefaultRoomState().furniture.length);
  });

  it("clears frame memories and the shared pet", () => {
    const mutation = createBreakupResetMutation(
      {
        roomId: "shared-room-1",
        memberIds: ["player-1"],
        members: [
          {
            playerId: "player-1",
            displayName: "Ari",
            role: "creator",
            joinedAt: "2026-03-26T13:00:00.000Z"
          }
        ]
      },
      "player-1",
      "2026-03-26T15:00:00.000Z"
    );

    expect(mutation.progression).toEqual(
      createInitialSharedRoomProgression(
        ["player-1"],
        [
          {
            playerId: "player-1",
            displayName: "Ari",
            role: "creator",
            joinedAt: "2026-03-26T13:00:00.000Z"
          }
        ],
        0,
        "2026-03-26T15:00:00.000Z"
      )
    );
    expect(mutation.frameMemories).toEqual({});
    expect(mutation.sharedPets).toHaveLength(0);
  });
});
