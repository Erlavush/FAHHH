import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { onDisconnect, onValue, ref, set } from "firebase/database";
import { firebaseAuth, firestore, googleProvider, realtimeDb } from "../../firebase";
import { createStarterFurniture, createStarterRoom } from "../room/starterRoom";
import { generateInviteCode, normalizeInviteCode } from "../utils/inviteCode";
import type {
  BackendUser,
  CoupleRoom,
  FurnitureInstance,
  InviteLink,
  PresenceState,
  RoomSnapshot,
  UserProfile
} from "../types";
import type { BackendService } from "./contracts";

function mapFirebaseUser(user: User): BackendUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "Player",
    photoURL: user.photoURL
  };
}

function assertFirebaseReady(): void {
  if (!firebaseAuth || !firestore || !realtimeDb) {
    throw new Error("Firebase is not configured.");
  }
}

function createProfile(user: BackendUser): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    avatarSeed: user.uid.slice(0, 8),
    coupleId: null,
    partnerId: null,
    partnerName: null,
    activeInviteCode: null
  };
}

async function findAvailableInviteCode(): Promise<string> {
  assertFirebaseReady();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateInviteCode();
    const inviteRef = doc(firestore!, "invites", code);
    const snapshot = await getDoc(inviteRef);

    if (!snapshot.exists()) {
      return code;
    }
  }

  throw new Error("Could not create a unique invite code. Please try again.");
}

export function createFirebaseBackend(): BackendService {
  assertFirebaseReady();

  return {
    mode: "firebase",

    onAuthStateChanged(listener) {
      return onAuthStateChanged(firebaseAuth!, (user) => {
        listener(user ? mapFirebaseUser(user) : null);
      });
    },

    async signInWithGoogle() {
      await signInWithPopup(firebaseAuth!, googleProvider as GoogleAuthProvider);
    },

    async signOut() {
      await firebaseSignOut(firebaseAuth!);
    },

    async ensureUserProfile(user) {
      const profileRef = doc(firestore!, "profiles", user.uid);
      const snapshot = await getDoc(profileRef);

      if (!snapshot.exists()) {
        await setDoc(profileRef, createProfile(user));
        return;
      }

      await updateDoc(profileRef, {
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    },

    subscribeUserProfile(userId, listener) {
      return onSnapshot(doc(firestore!, "profiles", userId), (snapshot) => {
        listener(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
      });
    },

    async createInvite(user, profile) {
      if (profile.coupleId) {
        throw new Error("You already have a partner.");
      }

      if (profile.activeInviteCode) {
        const existingInvite = await getDoc(doc(firestore!, "invites", profile.activeInviteCode));

        if (existingInvite.exists() && existingInvite.data().status === "open") {
          return profile.activeInviteCode;
        }
      }

      const code = await findAvailableInviteCode();
      const invite: InviteLink = {
        code,
        creatorUserId: user.uid,
        status: "open",
        claimedBy: null,
        coupleId: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
      };

      await setDoc(doc(firestore!, "invites", code), invite);
      await updateDoc(doc(firestore!, "profiles", user.uid), {
        activeInviteCode: code
      });

      return code;
    },

    async redeemInvite(code, user, profile) {
      const normalized = normalizeInviteCode(code);

      await runTransaction(firestore!, async (transaction) => {
        const inviteRef = doc(firestore!, "invites", normalized);
        const selfProfileRef = doc(firestore!, "profiles", user.uid);
        const inviteSnapshot = await transaction.get(inviteRef);
        const selfProfileSnapshot = await transaction.get(selfProfileRef);

        if (!inviteSnapshot.exists()) {
          throw new Error("That invite code does not exist.");
        }

        if (!selfProfileSnapshot.exists()) {
          throw new Error("Your profile is missing.");
        }

        const invite = inviteSnapshot.data() as InviteLink;
        const selfProfile = selfProfileSnapshot.data() as UserProfile;

        if (invite.status !== "open") {
          throw new Error("That invite code is no longer available.");
        }

        if (invite.creatorUserId === user.uid) {
          throw new Error("You cannot redeem your own invite.");
        }

        if (selfProfile.coupleId) {
          throw new Error("You are already linked to a partner.");
        }

        const creatorProfileRef = doc(firestore!, "profiles", invite.creatorUserId);
        const creatorProfileSnapshot = await transaction.get(creatorProfileRef);

        if (!creatorProfileSnapshot.exists()) {
          throw new Error("The invite creator profile is missing.");
        }

        const creatorProfile = creatorProfileSnapshot.data() as UserProfile;

        if (creatorProfile.coupleId) {
          throw new Error("That player is already linked to a partner.");
        }

        const coupleId = [invite.creatorUserId, user.uid].sort().join("_");
        const coupleRef = doc(firestore!, "couples", coupleId);
        const coupleSnapshot = await transaction.get(coupleRef);

        if (!coupleSnapshot.exists()) {
          const room = createStarterRoom(coupleId);
          transaction.set(coupleRef, room);

          for (const furniture of createStarterFurniture(coupleId, invite.creatorUserId)) {
            transaction.set(
              doc(collection(firestore!, "couples", coupleId, "furniture"), furniture.id),
              furniture
            );
          }
        }

        transaction.update(creatorProfileRef, {
          coupleId,
          partnerId: user.uid,
          partnerName: profile.displayName,
          activeInviteCode: null
        });

        transaction.update(selfProfileRef, {
          coupleId,
          partnerId: invite.creatorUserId,
          partnerName: creatorProfile.displayName,
          activeInviteCode: null
        });

        transaction.update(inviteRef, {
          status: "claimed",
          claimedBy: user.uid,
          coupleId,
          claimedAt: new Date().toISOString()
        });
      });
    },

    subscribeRoom(coupleId, listener) {
      let room: CoupleRoom | null = null;
      let furniture: FurnitureInstance[] = [];

      const emit = () => {
        listener({
          room,
          furniture: [...furniture].sort((left, right) => left.id.localeCompare(right.id))
        });
      };

      const stopRoom = onSnapshot(doc(firestore!, "couples", coupleId), (snapshot) => {
        room = snapshot.exists() ? (snapshot.data() as CoupleRoom) : null;
        emit();
      });

      const stopFurniture = onSnapshot(
        collection(firestore!, "couples", coupleId, "furniture"),
        (snapshot) => {
          furniture = snapshot.docs.map((item) => item.data() as FurnitureInstance);
          emit();
        }
      );

      return () => {
        stopRoom();
        stopFurniture();
      };
    },

    subscribePresence(coupleId, listener) {
      const presenceRef = ref(realtimeDb!, `presence/${coupleId}`);

      return onValue(presenceRef, (snapshot) => {
        const value = snapshot.val() as Record<string, PresenceState> | null;
        listener(value ? Object.values(value) : []);
      });
    },

    async connectPresence(coupleId, user, profile) {
      const presenceRef = ref(realtimeDb!, `presence/${coupleId}/${user.uid}`);
      const payload: PresenceState = {
        userId: user.uid,
        displayName: profile.displayName,
        avatarSeed: profile.avatarSeed,
        online: true,
        lastSeen: Date.now()
      };

      await set(presenceRef, payload);
      await onDisconnect(presenceRef).set({
        ...payload,
        online: false,
        lastSeen: Date.now()
      });

      const intervalId = window.setInterval(() => {
        void set(presenceRef, {
          ...payload,
          online: true,
          lastSeen: Date.now()
        });
      }, 12000);

      return async () => {
        window.clearInterval(intervalId);
        await set(presenceRef, {
          ...payload,
          online: false,
          lastSeen: Date.now()
        });
      };
    },

    async addFurniture(coupleId, furniture) {
      await setDoc(doc(firestore!, "couples", coupleId, "furniture", furniture.id), furniture);
    },

    async updateFurniture(coupleId, furnitureId, patch) {
      await updateDoc(doc(firestore!, "couples", coupleId, "furniture", furnitureId), {
        ...patch,
        updatedAt: new Date().toISOString()
      });
    },

    async removeFurniture(coupleId, furnitureId) {
      await deleteDoc(doc(firestore!, "couples", coupleId, "furniture", furnitureId));
    }
  };
}
