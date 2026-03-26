import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_SANDBOX_OWNER_ID,
  cloneRoomState,
  createDefaultRoomState,
  type RoomState
} from "../src/lib/roomState";
import { createSharedRoomSeed } from "../src/lib/sharedRoomSeed";

function createSeedSourceRoomState(): RoomState {
  const roomState = cloneRoomState(createDefaultRoomState());

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
      ownerId: LOCAL_SANDBOX_OWNER_ID,
      acquiredFrom: "sandbox_catalog"
    },
    {
      id: "owned-right-frame",
      type: "wall_frame",
      ownerId: LOCAL_SANDBOX_OWNER_ID,
      acquiredFrom: "sandbox_catalog"
    }
  );

  return roomState;
}

describe("sharedRoomTypes", () => {
  let sourceRoomState: RoomState;

  beforeEach(() => {
    sourceRoomState = createSeedSourceRoomState();
  });

  it("preserves anchorFurnitureId and surfaceLocalOffset while reassigning room ownership", () => {
    const sharedRoomState = createSharedRoomSeed("shared-room-1", sourceRoomState);
    const sharedBooks = sharedRoomState.furniture.find((placement) => placement.id === "starter-books");

    expect(sharedBooks?.anchorFurnitureId).toBe("starter-office-desk");
    expect(sharedBooks?.surfaceLocalOffset).toEqual([-0.65, 0.1]);
    expect(sharedRoomState.ownedFurniture.every((ownedFurniture) => ownedFurniture.ownerId === "shared-room:shared-room-1")).toBe(true);
  });

  it("keeps wall_front and wall_right placements in the shared seed", () => {
    const sharedRoomState = createSharedRoomSeed("shared-room-1", sourceRoomState);

    expect(sharedRoomState.furniture).toEqual(
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
  });

  it("does not mutate the source room state", () => {
    const sharedRoomState = createSharedRoomSeed("shared-room-1", sourceRoomState);

    expect(sharedRoomState.metadata.roomId).toBe("shared-room-1");
    expect(sourceRoomState.metadata.roomId).toBe("local-sandbox-room");
    expect(sourceRoomState.ownedFurniture.every((ownedFurniture) => ownedFurniture.ownerId === LOCAL_SANDBOX_OWNER_ID)).toBe(true);
  });
});
