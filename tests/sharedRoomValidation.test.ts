import { describe, expect, it } from "vitest";
import { cloneRoomState, createDefaultRoomState } from "../src/lib/roomState";
import { validateSharedRoomDocument } from "../src/lib/sharedRoomValidation";

function createSharedRoomDocument() {
  const roomState = cloneRoomState(createDefaultRoomState());

  roomState.metadata.roomId = "shared-room-1";
  roomState.furniture.push(
    {
      id: "front-poster",
      type: "poster",
      surface: "wall_front",
      position: [0, 2, 4.83],
      rotationY: Math.PI,
      ownedFurnitureId: "owned-front-poster"
    },
    {
      id: "right-frame",
      type: "wall_frame",
      surface: "wall_right",
      position: [4.83, 1.8, 0.5],
      rotationY: -Math.PI / 2,
      ownedFurnitureId: "owned-right-frame"
    }
  );
  roomState.ownedFurniture.push(
    {
      id: "owned-front-poster",
      type: "poster",
      ownerId: "shared-room:shared-room-1",
      acquiredFrom: "sandbox_catalog"
    },
    {
      id: "owned-right-frame",
      type: "wall_frame",
      ownerId: "shared-room:shared-room-1",
      acquiredFrom: "sandbox_catalog"
    }
  );

  return {
    roomId: "shared-room-1",
    inviteCode: "ABC123",
    memberIds: ["player-1"],
    members: [
      {
        playerId: "player-1",
        displayName: "Ari",
        role: "creator" as const,
        joinedAt: "2026-03-26T13:00:00.000Z"
      }
    ],
    revision: 1,
    sharedCoins: 50,
    seedKind: "dev-current-room" as const,
    createdAt: "2026-03-26T13:00:00.000Z",
    updatedAt: "2026-03-26T13:00:00.000Z",
    roomState
  };
}

describe("sharedRoomValidation", () => {
  it("accepts wall_front and wall_right placements", () => {
    const sharedRoomDocument = validateSharedRoomDocument(createSharedRoomDocument());

    expect(sharedRoomDocument.roomState.furniture).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "front-poster",
          surface: "wall_front"
        }),
        expect.objectContaining({
          id: "right-frame",
          surface: "wall_right"
        })
      ])
    );
    expect(sharedRoomDocument.progression.players["player-1"]?.coins).toBe(50);
  });

  it("accepts ceiling placements", () => {
    const document = createSharedRoomDocument();
    document.roomState.furniture[0] = {
      ...document.roomState.furniture[0],
      id: "ceiling-poster",
      surface: "ceiling",
      position: [0, 4.22, 0]
    } as any;

    const sharedRoomDocument = validateSharedRoomDocument(document);

    expect(sharedRoomDocument.roomState.furniture).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ceiling-poster",
          surface: "ceiling"
        })
      ])
    );
  });

  it("rejects unknown placement surfaces", () => {
    const invalidDocument = createSharedRoomDocument();
    invalidDocument.roomState.furniture[0] = {
      ...invalidDocument.roomState.furniture[0],
      surface: "roof"
    } as any;

    expect(() => validateSharedRoomDocument(invalidDocument)).toThrow(
      "Invalid shared room document"
    );
  });

  it("upgrades a legacy sharedCoins document into progression", () => {
    const sharedRoomDocument = validateSharedRoomDocument(createSharedRoomDocument());

    expect(sharedRoomDocument.progression.players["player-1"]).toMatchObject({
      coins: 50,
      level: 1,
      xp: 0
    });
    expect(sharedRoomDocument.progression.migratedFromSharedCoins).toBe(50);
  });

  it("defaults missing frame memories and shared pet state", () => {
    const sharedRoomDocument = validateSharedRoomDocument(createSharedRoomDocument());

    expect(sharedRoomDocument.frameMemories).toEqual({});
    expect(sharedRoomDocument.sharedPet).toBeNull();
  });

  it("prunes memories that no longer point at a wall frame", () => {
    const sharedRoomDocument = validateSharedRoomDocument({
      ...createSharedRoomDocument(),
      frameMemories: {
        "right-frame": {
          furnitureId: "right-frame",
          imageSrc: "data:image/jpeg;base64,abc",
          caption: "  shared   photo  ",
          updatedAt: "2026-03-26T13:00:00.000Z",
          updatedByPlayerId: "player-1"
        },
        missing: {
          furnitureId: "missing",
          imageSrc: "data:image/jpeg;base64,xyz",
          caption: "Should disappear",
          updatedAt: "2026-03-26T13:00:00.000Z",
          updatedByPlayerId: "player-1"
        }
      }
    });

    expect(sharedRoomDocument.frameMemories).toEqual({
      "right-frame": expect.objectContaining({
        furnitureId: "right-frame",
        caption: "shared photo"
      })
    });
  });
});
