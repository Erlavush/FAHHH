import { cloneRoomState } from "../../../lib/roomState";
import { cloneSharedRoomFrameMemories } from "../../../lib/sharedRoomMemories";
import { cloneSharedRoomPetRecord, migrateLegacySharedPetRecord } from "../../../lib/sharedRoomPet";
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
  const nowIso = new Date().toISOString();

  // Migration: Legacy rooms had a single sharedPet field.
  const rawSharedPet = (roomDocument as any).sharedPet;
  const sharedPets = Array.isArray(roomDocument.sharedPets)
    ? roomDocument.sharedPets.map(cloneSharedRoomPetRecord)
    : rawSharedPet
      ? [migrateLegacySharedPetRecord(rawSharedPet, nowIso)]
      : [];

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
      nowIso
    ),
    roomState: cloneRoomState(roomDocument.roomState),
    frameMemories: cloneSharedRoomFrameMemories(roomDocument.frameMemories),
    sharedPets
  };
}

export function shouldCommitSharedRoomChange(
  changeKind: "snapshot" | "committed"
): boolean {
  return changeKind === "committed";
}