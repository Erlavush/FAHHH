import { describe, expect, it } from "vitest";
import { createDefaultRoomState } from "../src/lib/roomState";
import {
  getSharedRoomMemoriesByCollection,
  pruneSharedRoomFrameMemories,
  sanitizeMemoryFrameCaption,
  upsertSharedRoomFrameMemory
} from "../src/lib/sharedRoomMemories";

describe("sharedRoomMemories", () => {
  it("normalizes captions down to a short single-line note and applies default collectionId", () => {
    expect(sanitizeMemoryFrameCaption("  our   first   room photo  ")).toBe(
      "our first room photo"
    );
    expect(sanitizeMemoryFrameCaption("   ")).toBeNull();

    const result = upsertSharedRoomFrameMemory({}, {
      furnitureId: "f1",
      imageSrc: "src",
      caption: "Hi",
      updatedAt: "now",
      updatedByPlayerId: "p1"
    });
    expect(result.f1.collectionId).toBe("default");
  });

  it("keeps only memories that still point at wall frames and preserves collectionId", () => {
    const roomState = createDefaultRoomState();
    const wallFrameId =
      roomState.furniture.find((placement) => placement.type === "wall_frame")?.id ??
      "starter-wall-frame";

    const frameMemories = pruneSharedRoomFrameMemories(
      {
        [wallFrameId]: {
          furnitureId: wallFrameId,
          collectionId: "vacation",
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
        caption: "cozy corner",
        collectionId: "vacation"
      })
    });
  });

  it("filters memories by collectionId", () => {
    const memories = {
      f1: {
        furnitureId: "f1",
        collectionId: "default",
        imageSrc: "src1",
        caption: "C1",
        updatedAt: "now",
        updatedByPlayerId: "p1"
      },
      f2: {
        furnitureId: "f2",
        collectionId: "vacation",
        imageSrc: "src2",
        caption: "C2",
        updatedAt: "now",
        updatedByPlayerId: "p1"
      }
    };

    const defaultItems = getSharedRoomMemoriesByCollection(memories);
    const vacationItems = getSharedRoomMemoriesByCollection(memories, "vacation");

    expect(defaultItems).toHaveLength(1);
    expect(defaultItems[0].furnitureId).toBe("f1");
    expect(vacationItems).toHaveLength(1);
    expect(vacationItems[0].furnitureId).toBe("f2");
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
