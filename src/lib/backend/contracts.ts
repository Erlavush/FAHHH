import type {
  BackendUser,
  FurnitureInstance,
  PresenceState,
  RoomSnapshot,
  UserProfile
} from "../types";

export interface BackendService {
  mode: "firebase" | "mock";
  onAuthStateChanged(listener: (user: BackendUser | null) => void): () => void;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  ensureUserProfile(user: BackendUser): Promise<void>;
  subscribeUserProfile(
    userId: string,
    listener: (profile: UserProfile | null) => void
  ): () => void;
  createInvite(user: BackendUser, profile: UserProfile): Promise<string>;
  redeemInvite(code: string, user: BackendUser, profile: UserProfile): Promise<void>;
  subscribeRoom(coupleId: string, listener: (room: RoomSnapshot) => void): () => void;
  subscribePresence(
    coupleId: string,
    listener: (presence: PresenceState[]) => void
  ): () => void;
  connectPresence(
    coupleId: string,
    user: BackendUser,
    profile: UserProfile
  ): Promise<() => void>;
  addFurniture(coupleId: string, furniture: FurnitureInstance): Promise<void>;
  updateFurniture(
    coupleId: string,
    furnitureId: string,
    patch: Partial<FurnitureInstance>
  ): Promise<void>;
  removeFurniture(coupleId: string, furnitureId: string): Promise<void>;
}
