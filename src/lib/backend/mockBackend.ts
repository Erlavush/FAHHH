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

interface MockStore {
  profiles: Record<string, UserProfile>;
  invites: Record<string, InviteLink>;
  couples: Record<string, CoupleRoom>;
  furniture: Record<string, Record<string, FurnitureInstance>>;
}

type Listener<T> = (value: T) => void;

const STORE_KEY = "cozy-couple-room::store";
const PRESENCE_KEY = "cozy-couple-room::presence";
const SESSION_USER_KEY = "cozy-couple-room::session-user";
const TAB_ID_KEY = "cozy-couple-room::tab-id";

const authListeners = new Set<Listener<BackendUser | null>>();
const profileListeners = new Map<string, Set<Listener<UserProfile | null>>>();
const roomListeners = new Map<string, Set<Listener<RoomSnapshot>>>();
const presenceListeners = new Map<string, Set<Listener<PresenceState[]>>>();

const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("cozy-couple-room") : null;

function getTabId(): string {
  const existing = sessionStorage.getItem(TAB_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  sessionStorage.setItem(TAB_ID_KEY, next);
  return next;
}

function readStore(): MockStore {
  const raw = localStorage.getItem(STORE_KEY);

  if (!raw) {
    return {
      profiles: {},
      invites: {},
      couples: {},
      furniture: {}
    };
  }

  return JSON.parse(raw) as MockStore;
}

function writeStore(store: MockStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  channel?.postMessage({ type: "store" });
  notifyAll();
}

function readPresenceStore(): Record<string, Record<string, PresenceState>> {
  const raw = localStorage.getItem(PRESENCE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, Record<string, PresenceState>>) : {};
}

function writePresenceStore(store: Record<string, Record<string, PresenceState>>): void {
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(store));
  channel?.postMessage({ type: "presence" });
  notifyAll();
}

function getCurrentUser(): BackendUser | null {
  const userId = sessionStorage.getItem(SESSION_USER_KEY);

  if (!userId) {
    return null;
  }

  const profile = readStore().profiles[userId];

  if (!profile) {
    return null;
  }

  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL
  };
}

function getRoomSnapshot(coupleId: string): RoomSnapshot {
  const store = readStore();
  return {
    room: store.couples[coupleId] ?? null,
    furniture: Object.values(store.furniture[coupleId] ?? {})
  };
}

function emitAuth(): void {
  const user = getCurrentUser();
  authListeners.forEach((listener) => listener(user));
}

function emitProfile(userId: string): void {
  const listeners = profileListeners.get(userId);
  if (!listeners) {
    return;
  }

  const profile = readStore().profiles[userId] ?? null;
  listeners.forEach((listener) => listener(profile));
}

function emitRoom(coupleId: string): void {
  const listeners = roomListeners.get(coupleId);
  if (!listeners) {
    return;
  }

  const snapshot = getRoomSnapshot(coupleId);
  listeners.forEach((listener) => listener(snapshot));
}

function emitPresence(coupleId: string): void {
  const listeners = presenceListeners.get(coupleId);
  if (!listeners) {
    return;
  }

  const presence = Object.values(readPresenceStore()[coupleId] ?? {});
  listeners.forEach((listener) => listener(presence));
}

function notifyAll(): void {
  emitAuth();
  profileListeners.forEach((_, userId) => emitProfile(userId));
  roomListeners.forEach((_, coupleId) => emitRoom(coupleId));
  presenceListeners.forEach((_, coupleId) => emitPresence(coupleId));
}

function ensurePresenceBucket(
  store: Record<string, Record<string, PresenceState>>,
  coupleId: string
): Record<string, PresenceState> {
  if (!store[coupleId]) {
    store[coupleId] = {};
  }

  return store[coupleId];
}

function buildDisplayName(): string {
  const names = ["Aster", "Mika", "Noah", "Lio", "Sora", "Rin", "Jules", "Kai"];
  return `${names[Math.floor(Math.random() * names.length)]} ${Math.floor(Math.random() * 90 + 10)}`;
}

function createMockUser(): BackendUser {
  return {
    uid: crypto.randomUUID(),
    displayName: buildDisplayName(),
    photoURL: null
  };
}

window.addEventListener("storage", (event) => {
  if (event.key === STORE_KEY || event.key === PRESENCE_KEY) {
    notifyAll();
  }
});

channel?.addEventListener("message", () => {
  notifyAll();
});

export function createMockBackend(): BackendService {
  return {
    mode: "mock",

    onAuthStateChanged(listener) {
      authListeners.add(listener);
      listener(getCurrentUser());

      return () => {
        authListeners.delete(listener);
      };
    },

    async signInWithGoogle() {
      const current = getCurrentUser();
      if (current) {
        return;
      }

      const nextUser = createMockUser();
      sessionStorage.setItem(SESSION_USER_KEY, nextUser.uid);
      await this.ensureUserProfile(nextUser);
      emitAuth();
    },

    async signOut() {
      sessionStorage.removeItem(SESSION_USER_KEY);
      emitAuth();
    },

    async ensureUserProfile(user) {
      const store = readStore();

      if (!store.profiles[user.uid]) {
        store.profiles[user.uid] = {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          avatarSeed: user.uid.slice(0, 8),
          coupleId: null,
          partnerId: null,
          partnerName: null,
          activeInviteCode: null
        };
      } else {
        store.profiles[user.uid] = {
          ...store.profiles[user.uid],
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      }

      writeStore(store);
    },

    subscribeUserProfile(userId, listener) {
      const listeners = profileListeners.get(userId) ?? new Set();
      listeners.add(listener);
      profileListeners.set(userId, listeners);
      listener(readStore().profiles[userId] ?? null);

      return () => {
        listeners.delete(listener);
      };
    },

    async createInvite(user, profile) {
      if (profile.coupleId) {
        throw new Error("You already have a partner.");
      }

      const store = readStore();

      if (profile.activeInviteCode && store.invites[profile.activeInviteCode]?.status === "open") {
        return profile.activeInviteCode;
      }

      let code = generateInviteCode();

      while (store.invites[code]) {
        code = generateInviteCode();
      }

      store.invites[code] = {
        code,
        creatorUserId: user.uid,
        status: "open",
        claimedBy: null,
        coupleId: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
      };
      store.profiles[user.uid] = {
        ...profile,
        activeInviteCode: code
      };
      writeStore(store);

      return code;
    },

    async redeemInvite(code, user, profile) {
      const normalized = normalizeInviteCode(code);
      const store = readStore();
      const invite = store.invites[normalized];

      if (!invite) {
        throw new Error("That invite code does not exist.");
      }

      if (invite.status !== "open") {
        throw new Error("That invite code is no longer available.");
      }

      if (invite.creatorUserId === user.uid) {
        throw new Error("You cannot join your own invite.");
      }

      const creatorProfile = store.profiles[invite.creatorUserId];

      if (!creatorProfile) {
        throw new Error("Invite creator profile is missing.");
      }

      if (creatorProfile.coupleId || profile.coupleId) {
        throw new Error("One of these accounts is already linked.");
      }

      const coupleId = [invite.creatorUserId, user.uid].sort().join("_");

      store.couples[coupleId] = store.couples[coupleId] ?? createStarterRoom(coupleId);
      store.furniture[coupleId] = store.furniture[coupleId] ?? Object.fromEntries(
        createStarterFurniture(coupleId, invite.creatorUserId).map((item) => [item.id, item])
      );

      store.profiles[invite.creatorUserId] = {
        ...creatorProfile,
        coupleId,
        partnerId: user.uid,
        partnerName: profile.displayName,
        activeInviteCode: null
      };

      store.profiles[user.uid] = {
        ...profile,
        coupleId,
        partnerId: invite.creatorUserId,
        partnerName: creatorProfile.displayName,
        activeInviteCode: null
      };

      store.invites[normalized] = {
        ...invite,
        status: "claimed",
        claimedBy: user.uid,
        coupleId,
        claimedAt: new Date().toISOString()
      };

      writeStore(store);
    },

    subscribeRoom(coupleId, listener) {
      const listeners = roomListeners.get(coupleId) ?? new Set();
      listeners.add(listener);
      roomListeners.set(coupleId, listeners);
      listener(getRoomSnapshot(coupleId));

      return () => {
        listeners.delete(listener);
      };
    },

    subscribePresence(coupleId, listener) {
      const listeners = presenceListeners.get(coupleId) ?? new Set();
      listeners.add(listener);
      presenceListeners.set(coupleId, listeners);
      listener(Object.values(readPresenceStore()[coupleId] ?? {}));

      return () => {
        listeners.delete(listener);
      };
    },

    async connectPresence(coupleId, user, profile) {
      const tabId = getTabId();
      const userPresenceKey = `${user.uid}:${tabId}`;
      const publish = (online: boolean) => {
        const store = readPresenceStore();
        const bucket = ensurePresenceBucket(store, coupleId);
        bucket[userPresenceKey] = {
          userId: user.uid,
          displayName: profile.displayName,
          avatarSeed: profile.avatarSeed,
          online,
          lastSeen: Date.now()
        };
        writePresenceStore(store);
      };

      publish(true);

      const intervalId = window.setInterval(() => {
        publish(true);
      }, 12000);

      const handleBeforeUnload = () => {
        publish(false);
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return async () => {
        window.clearInterval(intervalId);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        publish(false);
      };
    },

    async addFurniture(coupleId, furniture) {
      const store = readStore();
      store.furniture[coupleId] = store.furniture[coupleId] ?? {};
      store.furniture[coupleId][furniture.id] = furniture;
      writeStore(store);
    },

    async updateFurniture(coupleId, furnitureId, patch) {
      const store = readStore();
      const current = store.furniture[coupleId]?.[furnitureId];

      if (!current) {
        return;
      }

      store.furniture[coupleId][furnitureId] = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
      };
      writeStore(store);
    },

    async removeFurniture(coupleId, furnitureId) {
      const store = readStore();

      if (store.furniture[coupleId]?.[furnitureId]) {
        delete store.furniture[coupleId][furnitureId];
        writeStore(store);
      }
    }
  };
}
