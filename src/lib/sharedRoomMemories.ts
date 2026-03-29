import type { RoomState } from "./roomState";
import type { SharedRoomFrameMemory } from "./sharedRoomTypes";

const MEMORY_FRAME_CAPTION_MAX_LENGTH = 120;

export function sanitizeMemoryFrameCaption(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedCaption = value.trim().replace(/\s+/g, " ");
  if (normalizedCaption.length === 0) {
    return null;
  }

  return normalizedCaption.slice(0, MEMORY_FRAME_CAPTION_MAX_LENGTH);
}

export function cloneSharedRoomFrameMemory(
  memory: SharedRoomFrameMemory
): SharedRoomFrameMemory {
  return {
    ...memory,
    collectionId: memory.collectionId ?? "default",
    caption: sanitizeMemoryFrameCaption(memory.caption)
  };
}

export function cloneSharedRoomFrameMemories(
  frameMemories: Record<string, SharedRoomFrameMemory>
): Record<string, SharedRoomFrameMemory> {
  return Object.fromEntries(
    Object.entries(frameMemories).map(([furnitureId, memory]) => [
      furnitureId,
      cloneSharedRoomFrameMemory(memory)
    ])
  );
}

export function getSharedRoomMemoriesByCollection(
  frameMemories: Record<string, SharedRoomFrameMemory>,
  collectionId = "default"
): SharedRoomFrameMemory[] {
  return Object.values(frameMemories).filter(
    (memory) => (memory.collectionId ?? "default") === collectionId
  );
}

export function pruneSharedRoomFrameMemories(
  frameMemories: Record<string, SharedRoomFrameMemory>,
  roomState: RoomState
): Record<string, SharedRoomFrameMemory> {
  const wallFrameIds = new Set(
    roomState.furniture
      .filter((placement) => placement.type === "wall_frame")
      .map((placement) => placement.id)
  );

  return Object.fromEntries(
    Object.entries(frameMemories)
      .filter(([furnitureId, memory]) => {
        return (
          wallFrameIds.has(furnitureId) &&
          memory.furnitureId === furnitureId &&
          typeof memory.imageSrc === "string" &&
          memory.imageSrc.length > 0
        );
      })
      .map(([furnitureId, memory]) => [
        furnitureId,
        cloneSharedRoomFrameMemory(memory)
      ])
  );
}

export function upsertSharedRoomFrameMemory(
  frameMemories: Record<string, SharedRoomFrameMemory>,
  memory: SharedRoomFrameMemory
): Record<string, SharedRoomFrameMemory> {
  const normalizedMemory = cloneSharedRoomFrameMemory(memory);

  return {
    ...frameMemories,
    [normalizedMemory.furnitureId]: normalizedMemory
  };
}
