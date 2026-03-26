import {
  cloneRoomState,
  ensureRoomStateOwnership,
  type RoomState
} from "./roomState";
import { SHARED_ROOM_OWNER_ID_PREFIX } from "./sharedRoomTypes";

export function buildSharedRoomOwnerId(roomId: string): string {
  return `${SHARED_ROOM_OWNER_ID_PREFIX}:${roomId}`;
}

export function createSharedRoomSeed(roomId: string, sourceRoomState: RoomState): RoomState {
  const normalizedRoomState = ensureRoomStateOwnership(cloneRoomState(sourceRoomState));
  const sharedOwnerId = buildSharedRoomOwnerId(roomId);

  return {
    metadata: {
      ...normalizedRoomState.metadata,
      roomId
    },
    furniture: normalizedRoomState.furniture,
    ownedFurniture: normalizedRoomState.ownedFurniture.map((ownedFurniture) => ({
      ...ownedFurniture,
      ownerId: sharedOwnerId
    }))
  };
}
