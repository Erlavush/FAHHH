export type FurnitureType =
  | "bed"
  | "desk"
  | "pc"
  | "side_table"
  | "vase"
  | "small_frame"
  | "poster"
  | "wall_frame"
  | "floor_rug"
  | "plant"
  | "lamp"
  | "stool"
  | "book_stack"
  | "cushion";

export type FurnitureSurface = "floor" | "wall" | "table";

export interface Transform3D {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface BackendUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  avatarSeed: string;
  coupleId: string | null;
  partnerId: string | null;
  partnerName: string | null;
  activeInviteCode: string | null;
}

export interface InviteLink {
  code: string;
  creatorUserId: string;
  status: "open" | "claimed" | "expired";
  claimedBy: string | null;
  coupleId: string | null;
  createdAt: string;
  expiresAt: string;
  claimedAt?: string;
}

export interface CoupleRoom {
  id: string;
  coupleId: string;
  roomTheme: string;
  layoutVersion: number;
  createdAt: string;
}

export interface FurnitureInstance extends Transform3D {
  id: string;
  coupleId: string;
  type: FurnitureType;
  variant: string;
  surface: FurnitureSurface;
  locked: boolean;
  placedBy: string;
  updatedAt: string;
}

export interface PresenceState {
  userId: string;
  displayName: string;
  avatarSeed: string;
  online: boolean;
  lastSeen: number;
}

export interface RoomSnapshot {
  room: CoupleRoom | null;
  furniture: FurnitureInstance[];
}
