import {
  advanceRitualDayIfNeeded,
  createInitialSharedRoomProgression,
  ensureSharedRoomProgressionMembers
} from "./sharedProgression";
import {
  FURNITURE_REGISTRY,
  type FurniturePlacementSurface
} from "./furnitureRegistry";
import {
  cloneRoomState,
  ensureRoomStateOwnership,
  type OwnedFurnitureItem,
  type RoomFurniturePlacement,
  type RoomState
} from "./roomState";
import {
  pruneSharedRoomFrameMemories,
  sanitizeMemoryFrameCaption
} from "./sharedRoomMemories";
import { cloneSharedRoomPetRecord } from "./sharedRoomPet";
import type {
  SharedPlayerProfile,
  SharedPendingPairLink,
  SharedRoomFrameMemory,
  SharedRoomDocument,
  SharedRoomInvite,
  SharedRoomMembership,
  SharedRoomMember,
  SharedRoomPetRecord,
  SharedRoomSession
} from "./sharedRoomTypes";
import type { SharedRoomProgressionState } from "./sharedProgressionTypes";

export const VALID_SHARED_ROOM_SURFACES: FurniturePlacementSurface[] = [
  "floor",
  "wall_back",
  "wall_left",
  "wall_front",
  "wall_right",
  "surface"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidPlacementSurface(value: unknown): value is FurniturePlacementSurface {
  return VALID_SHARED_ROOM_SURFACES.includes(value as FurniturePlacementSurface);
}

function isValidFurniturePlacement(value: unknown): value is RoomFurniturePlacement {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    value.type in FURNITURE_REGISTRY &&
    isValidPlacementSurface(value.surface) &&
    Array.isArray(value.position) &&
    value.position.length === 3 &&
    value.position.every((entry) => typeof entry === "number") &&
    typeof value.rotationY === "number" &&
    typeof value.ownedFurnitureId === "string" &&
    (!("anchorFurnitureId" in value) ||
      value.anchorFurnitureId === undefined ||
      typeof value.anchorFurnitureId === "string") &&
    (!("surfaceLocalOffset" in value) ||
      value.surfaceLocalOffset === undefined ||
      (Array.isArray(value.surfaceLocalOffset) &&
        value.surfaceLocalOffset.length === 2 &&
        value.surfaceLocalOffset.every((entry) => typeof entry === "number")))
  );
}

function isValidOwnedFurnitureItem(value: unknown): value is OwnedFurnitureItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    value.type in FURNITURE_REGISTRY &&
    typeof value.ownerId === "string" &&
    (value.acquiredFrom === "starter" || value.acquiredFrom === "sandbox_catalog")
  );
}

function isValidRoomState(value: unknown): value is RoomState {
  return (
    isRecord(value) &&
    isRecord(value.metadata) &&
    typeof value.metadata.roomId === "string" &&
    typeof value.metadata.roomTheme === "string" &&
    typeof value.metadata.layoutVersion === "number" &&
    Array.isArray(value.metadata.unlockedFurniture) &&
    value.metadata.unlockedFurniture.every(
      (entry) => typeof entry === "string" && entry in FURNITURE_REGISTRY
    ) &&
    Array.isArray(value.furniture) &&
    value.furniture.every(isValidFurniturePlacement) &&
    Array.isArray(value.ownedFurniture) &&
    value.ownedFurniture.every(isValidOwnedFurnitureItem)
  );
}

function isValidSharedRoomFrameMemory(
  value: unknown
): value is SharedRoomFrameMemory {
  return (
    isRecord(value) &&
    typeof value.furnitureId === "string" &&
    typeof value.imageSrc === "string" &&
    value.imageSrc.length > 0 &&
    (value.caption === null || typeof value.caption === "string") &&
    isIsoDateString(value.updatedAt) &&
    typeof value.updatedByPlayerId === "string"
  );
}

function isValidSharedRoomPetRecord(value: unknown): value is SharedRoomPetRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.type === "minecraft_cat" &&
    value.presetId === "better_cat_glb" &&
    Array.isArray(value.spawnPosition) &&
    value.spawnPosition.length === 3 &&
    value.spawnPosition.every((entry) => typeof entry === "number") &&
    isIsoDateString(value.adoptedAt) &&
    typeof value.adoptedByPlayerId === "string"
  );
}

export function isValidSharedPlayerProfile(value: unknown): value is SharedPlayerProfile {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    isIsoDateString(value.createdAt) &&
    isIsoDateString(value.updatedAt)
  );
}

function isValidSharedRoomMember(value: unknown): value is SharedRoomMember {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    (value.role === "creator" || value.role === "partner") &&
    isIsoDateString(value.joinedAt)
  );
}

export function isValidSharedRoomInvite(value: unknown): value is SharedRoomInvite {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.roomId === "string" &&
    typeof value.creatorPlayerId === "string" &&
    (value.status === "open" || value.status === "consumed") &&
    isIsoDateString(value.createdAt) &&
    (value.consumedAt === null || isIsoDateString(value.consumedAt))
  );
}

export function isValidSharedRoomMembership(
  value: unknown
): value is SharedRoomMembership {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.roomId === "string" &&
    typeof value.partnerPlayerId === "string" &&
    typeof value.pairCode === "string" &&
    isIsoDateString(value.pairedAt)
  );
}

export function isValidSharedPendingPairLink(
  value: unknown
): value is SharedPendingPairLink {
  return (
    isRecord(value) &&
    typeof value.pendingLinkId === "string" &&
    Array.isArray(value.playerIds) &&
    value.playerIds.length === 2 &&
    value.playerIds.every((entry) => typeof entry === "string" && entry.length > 0) &&
    new Set(value.playerIds).size === value.playerIds.length &&
    typeof value.submittedByPlayerId === "string" &&
    typeof value.targetPairCode === "string" &&
    isRecord(value.confirmationsByPlayerId) &&
    Object.values(value.confirmationsByPlayerId).every(
      (entry) => typeof entry === "boolean"
    ) &&
    isIsoDateString(value.expiresAt) &&
    (!("playerDisplayNamesById" in value) ||
      value.playerDisplayNamesById === undefined ||
      (isRecord(value.playerDisplayNamesById) &&
        Object.values(value.playerDisplayNamesById).every(
          (entry) => typeof entry === "string"
        )))
  );
}

export function isValidSharedRoomSession(value: unknown): value is SharedRoomSession {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    (typeof value.partnerId === "string" || value.partnerId === null) &&
    typeof value.roomId === "string" &&
    typeof value.inviteCode === "string" &&
    typeof value.lastKnownRevision === "number" &&
    Number.isFinite(value.lastKnownRevision)
  );
}

export function isValidSharedRoomDocument(value: unknown): value is SharedRoomDocument {
  if (!isRecord(value)) {
    return false;
  }

  const memberIds = value.memberIds;
  const members = value.members;

  return (
    typeof value.roomId === "string" &&
    typeof value.inviteCode === "string" &&
    Array.isArray(memberIds) &&
    memberIds.length > 0 &&
    memberIds.length <= 2 &&
    memberIds.every((entry) => typeof entry === "string") &&
    Array.isArray(members) &&
    members.length > 0 &&
    members.length <= 2 &&
    members.every(isValidSharedRoomMember) &&
    typeof value.revision === "number" &&
    Number.isFinite(value.revision) &&
    value.revision >= 1 &&
    Number.isInteger(value.revision) &&
    isRecord(value.progression) &&
    (value.seedKind === "dev-current-room" || value.seedKind === "starter-room") &&
    isIsoDateString(value.createdAt) &&
    isIsoDateString(value.updatedAt) &&
    isValidRoomState(value.roomState) &&
    value.roomState.metadata.roomId === value.roomId &&
    isRecord(value.frameMemories) &&
    Object.values(value.frameMemories).every(isValidSharedRoomFrameMemory) &&
    Object.entries(value.frameMemories as Record<string, SharedRoomFrameMemory>).every(
      ([furnitureId, memory]) => memory.furnitureId === furnitureId
    ) &&
    (value.sharedPet === null || isValidSharedRoomPetRecord(value.sharedPet)) &&
    memberIds.length === members.length &&
    members.every((member) => memberIds.includes(member.playerId))
  );
}

function normalizeSharedRoomProgression(
  value: Record<string, unknown>,
  memberIds: string[],
  members: SharedRoomMember[],
  updatedAt: string
): SharedRoomProgressionState {
  const rawProgression = isRecord(value.progression) ? value.progression : null;
  const legacySharedCoins =
    typeof value.sharedCoins === "number" && Number.isFinite(value.sharedCoins)
      ? Math.max(0, Math.floor(value.sharedCoins))
      : 0;

  if (!rawProgression) {
    return createInitialSharedRoomProgression(
      memberIds,
      members,
      legacySharedCoins,
      updatedAt
    );
  }

  const safeProgression: SharedRoomProgressionState = {
    version: 1,
    players:
      isRecord(rawProgression.players)
        ? (rawProgression.players as SharedRoomProgressionState["players"])
        : {},
    couple: rawProgression.couple as SharedRoomProgressionState["couple"],
    migratedFromSharedCoins:
      typeof rawProgression.migratedFromSharedCoins === "number" &&
      Number.isFinite(rawProgression.migratedFromSharedCoins)
        ? Math.max(0, Math.floor(rawProgression.migratedFromSharedCoins))
        : legacySharedCoins || null
  };

  return advanceRitualDayIfNeeded(
    ensureSharedRoomProgressionMembers(safeProgression, memberIds, members, updatedAt),
    memberIds,
    members,
    updatedAt
  );
}

function normalizeSharedRoomFrameMemories(
  value: Record<string, unknown>,
  roomState: RoomState
): Record<string, SharedRoomFrameMemory> {
  if (!isRecord(value.frameMemories)) {
    return {};
  }

  const normalizedFrameMemories = Object.fromEntries(
    Object.entries(value.frameMemories)
      .filter((entry): entry is [string, SharedRoomFrameMemory] => {
        return isValidSharedRoomFrameMemory(entry[1]);
      })
      .map(([furnitureId, memory]) => [
        furnitureId,
        {
          ...memory,
          caption: sanitizeMemoryFrameCaption(memory.caption)
        }
      ])
  );

  return pruneSharedRoomFrameMemories(normalizedFrameMemories, roomState);
}

function normalizeSharedRoomPetRecord(
  value: Record<string, unknown>
): SharedRoomPetRecord | null {
  return isValidSharedRoomPetRecord(value.sharedPet)
    ? cloneSharedRoomPetRecord(value.sharedPet)
    : null;
}

export function validateSharedRoomDocument(value: unknown): SharedRoomDocument {
  if (!isRecord(value)) {
    throw new Error("Invalid shared room document");
  }

  const memberIds = Array.isArray(value.memberIds)
    ? value.memberIds.filter((entry): entry is string => typeof entry === "string")
    : [];
  const members = Array.isArray(value.members)
    ? value.members.filter(isValidSharedRoomMember)
    : [];

  if (
    typeof value.roomId !== "string" ||
    typeof value.inviteCode !== "string" ||
    memberIds.length === 0 ||
    memberIds.length > 2 ||
    members.length === 0 ||
    members.length > 2 ||
    typeof value.revision !== "number" ||
    !Number.isFinite(value.revision) ||
    value.revision < 1 ||
    !Number.isInteger(value.revision) ||
    (value.seedKind !== "dev-current-room" && value.seedKind !== "starter-room") ||
    !isIsoDateString(value.createdAt) ||
    !isIsoDateString(value.updatedAt) ||
    !isValidRoomState(value.roomState) ||
    value.roomState.metadata.roomId !== value.roomId ||
    memberIds.length !== members.length ||
    !members.every((member) => memberIds.includes(member.playerId))
  ) {
    throw new Error("Invalid shared room document");
  }

  const document = value as Record<string, unknown>;
  const normalizedProgression = normalizeSharedRoomProgression(
    document,
    memberIds,
    members,
    value.updatedAt
  );
  const normalizedRoomState = ensureRoomStateOwnership(cloneRoomState(value.roomState));
  const normalizedFrameMemories = normalizeSharedRoomFrameMemories(
    document,
    normalizedRoomState
  );
  const normalizedSharedPet = normalizeSharedRoomPetRecord(document);

  return {
    roomId: value.roomId,
    inviteCode: value.inviteCode,
    memberIds: [...memberIds],
    members: members.map((member) => ({ ...member })),
    revision: Math.floor(value.revision),
    progression: normalizedProgression,
    seedKind: value.seedKind,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    roomState: normalizedRoomState,
    frameMemories: normalizedFrameMemories,
    sharedPet: normalizedSharedPet
  };
}

export function validateSharedRoomMembership(
  value: unknown
): SharedRoomMembership {
  if (!isValidSharedRoomMembership(value)) {
    throw new Error("Invalid shared room membership");
  }

  return {
    ...(value as SharedRoomMembership)
  };
}

export function validateSharedPendingPairLink(
  value: unknown
): SharedPendingPairLink {
  if (!isValidSharedPendingPairLink(value)) {
    throw new Error("Invalid shared pending pair link");
  }

  const pendingLink = value as SharedPendingPairLink;

  return {
    ...pendingLink,
    playerIds: [...pendingLink.playerIds],
    confirmationsByPlayerId: { ...pendingLink.confirmationsByPlayerId },
    playerDisplayNamesById: pendingLink.playerDisplayNamesById
      ? { ...pendingLink.playerDisplayNamesById }
      : undefined
  };
}
