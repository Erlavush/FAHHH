import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
import {
  pruneSharedRoomFrameMemories,
  sanitizeMemoryFrameCaption,
  upsertSharedRoomFrameMemory
} from "../src/lib/sharedRoomMemories";

describe("sharedRoomMemories", () => {
  it("normalizes captions down to a short single-line note", () => {
    expect(sanitizeMemoryFrameCaption("  our   first   room photo  ")).toBe(
      "our first room photo"
    );
    expect(sanitizeMemoryFrameCaption("   ")).toBeNull();
  });

  it("keeps only memories that still point at wall frames", () => {
    const roomState = createDefaultRoomState();
    const wallFrameId =
      roomState.furniture.find((placement) => placement.type === "wall_frame")?.id ??
      "starter-wall-frame";

    const frameMemories = pruneSharedRoomFrameMemories(
      {
        [wallFrameId]: {
          furnitureId: wallFrameId,
          imageSrc: "data:image/jpeg;base64,abc",
          caption: "  cozy   corner ",
          updatedAt: "2026-03-26T13:00:00.000Z",
          updatedByPlayerId: "player-1"
        },
        missing: {
          furnitureId: "missing",
          imageSrc: "data:image/jpeg;base64,xyz",
          caption: "remove me",
          updatedAt: "2026-03-26T13:00:00.000Z",
          updatedByPlayerId: "player-1"
        }
      },
      roomState
    );

    expect(frameMemories).toEqual({
      [wallFrameId]: expect.objectContaining({
        caption: "cozy corner"
      })
    });
  });

  it("upserts one canonical memory per furniture id", () => {
    const firstRecord = upsertSharedRoomFrameMemory(
      {},
      {
        furnitureId: "starter-wall-frame",
        imageSrc: "data:image/jpeg;base64,abc",
        caption: "First",
        updatedAt: "2026-03-26T13:00:00.000Z",
        updatedByPlayerId: "player-1"
      }
    );

    const secondRecord = upsertSharedRoomFrameMemory(firstRecord, {
      furnitureId: "starter-wall-frame",
      imageSrc: "data:image/jpeg;base64,def",
      caption: "Second",
      updatedAt: "2026-03-26T13:01:00.000Z",
      updatedByPlayerId: "player-2"
    });

    expect(secondRecord).toEqual({
      "starter-wall-frame": expect.objectContaining({
        imageSrc: "data:image/jpeg;base64,def",
        caption: "Second",
        updatedByPlayerId: "player-2"
      })
    });
  });
});
