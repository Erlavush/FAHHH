import { createDefaultRoomState } from "./roomState";
import { createInitialSharedRoomProgression } from "./sharedProgression";
import { createSharedRoomSeed } from "./sharedRoomSeed";
import type { SharedRoomMember } from "./sharedRoomTypes";

type BreakupResetSnapshot = {
  roomId: string;
  memberIds: string[];
  members: SharedRoomMember[];
};

export function createBreakupResetMutation(
  snapshot: BreakupResetSnapshot,
  actorPlayerId: string,
  nowIso: string
) {
  void actorPlayerId;

  return {
    roomState: createSharedRoomSeed(snapshot.roomId, createDefaultRoomState()),
    progression: createInitialSharedRoomProgression(
      snapshot.memberIds,
      snapshot.members,
      0,
      nowIso
    ),
    frameMemories: {},
    sharedPets: []
  };
}
