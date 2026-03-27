import { cloneRoomState } from "../../../lib/roomState";
import { cloneSharedRoomFrameMemories } from "../../../lib/sharedRoomMemories";
import { cloneSharedRoomPetRecord } from "../../../lib/sharedRoomPet";
import { advanceRitualDayIfNeeded } from "../../../lib/sharedProgression";
import type { SharedRoomDocument, SharedRoomSession } from "../../../lib/sharedRoomTypes";
import type { SharedRoomRuntimeSnapshot } from "./runtimeTypes";

export function createSharedRoomSessionFromDocument(
  playerId: string,
  roomDocument: SharedRoomDocument
): SharedRoomSession {
  const partnerId =
    roomDocument.memberIds.find((memberId) => memberId !== playerId) ?? null;

  return {
    playerId,
    partnerId,
    roomId: roomDocument.roomId,
    inviteCode: roomDocument.inviteCode,
    lastKnownRevision: roomDocument.revision
  };
}

export function createSharedRoomRuntimeSnapshot(
  roomDocument: SharedRoomDocument
): SharedRoomRuntimeSnapshot {
  return {
    roomId: roomDocument.roomId,
    inviteCode: roomDocument.inviteCode,
    revision: roomDocument.revision,
    memberIds: [...roomDocument.memberIds],
    members: roomDocument.members.map((member) => ({ ...member })),
    progression: advanceRitualDayIfNeeded(
      roomDocument.progression,
      roomDocument.memberIds,
      roomDocument.members,
      new Date().toISOString()
    ),
    roomState: cloneRoomState(roomDocument.roomState),
    frameMemories: cloneSharedRoomFrameMemories(roomDocument.frameMemories),
    sharedPet: roomDocument.sharedPet
      ? cloneSharedRoomPetRecord(roomDocument.sharedPet)
      : null
  };
}

export function shouldCommitSharedRoomChange(
  changeKind: "snapshot" | "committed"
): boolean {
  return changeKind === "committed";
}