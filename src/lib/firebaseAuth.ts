import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential
} from "firebase/auth";
import type { SharedPlayerProfile } from "./sharedRoomTypes";
import { getFirebaseApp } from "./firebaseApp";

const DEFAULT_SHARED_AUTH_NAME = "Player";

function getSharedAuth() {
  return getAuth(getFirebaseApp());
}

function toIsoTimestamp(
  rawTimestamp: string | null | undefined,
  fallback: string
): string {
  if (!rawTimestamp) {
    return fallback;
  }

  const parsed = Date.parse(rawTimestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

export function toSharedPlayerProfile(
  user: User,
  fallbackDisplayName = DEFAULT_SHARED_AUTH_NAME
): SharedPlayerProfile {
  const nowIso = new Date().toISOString();
  const createdAt = toIsoTimestamp(user.metadata.creationTime, nowIso);

  return {
    playerId: user.uid,
    displayName:
      user.displayName?.trim() ||
      user.email?.trim() ||
      fallbackDisplayName.trim() ||
      DEFAULT_SHARED_AUTH_NAME,
    createdAt,
    updatedAt: toIsoTimestamp(user.metadata.lastSignInTime, createdAt)
  };
}

export function subscribeToSharedAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(getSharedAuth(), callback);
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getSharedAuth(), provider);
}

export async function signOutSharedAuth(): Promise<void> {
  await signOut(getSharedAuth());
}
