import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  setDoc,
  where,
  type Firestore
} from "firebase/firestore";
import { DEFAULT_PLAYER_POSITION } from "../app/constants";
import { getFirebaseApp } from "./firebaseApp";
import { pickPetSpawnPosition } from "./petPathing";
import { createInitialSharedRoomProgression } from "./sharedProgression";
import {
  assertPairLinkSubmissionAllowed,
  deriveSharedRoomBootstrapState,
  isPendingPairLinkReady,
  normalizePairCode,
  rejectInvalidPairParticipants
} from "./sharedRoomOwnership";
import type {
  ConfirmPairLinkInput,
  LoadSharedRoomBootstrapStateInput,
  SharedRoomOwnershipStore,
  SubmitPairCodeInput
} from "./sharedRoomOwnershipStore";
import { createSharedRoomPetRecord } from "./sharedRoomPet";
import { createSharedRoomSeed } from "./sharedRoomSeed";
import {
  validateSharedPendingPairLink,
  validateSharedRoomDocument,
  validateSharedRoomMembership
} from "./sharedRoomValidation";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomBootstrapState,
  SharedRoomDocument,
  SharedRoomMembership,
  SharedRoomMember
} from "./sharedRoomTypes";
import { createDefaultRoomState } from "./roomState";

export interface FirebasePairCodeRecord {
  playerId: string;
  pairCode: string;
  displayName: string;
  updatedAt: string;
}

export interface FirebaseHostedDatabase {
  roomMemberships: Record<string, SharedRoomMembership>;
  pendingPairLinks: Record<string, SharedPendingPairLink>;
  pairCodes: Record<string, FirebasePairCodeRecord>;
  sharedRooms: Record<string, SharedRoomDocument>;
  roomPresence: Record<string, Record<string, unknown>>;
  roomLocks: Record<string, Record<string, unknown>>;
  pairLinkPresence: Record<string, Record<string, unknown>>;
}

export interface FirebaseOwnershipStoreOptions {
  database?: FirebaseHostedDatabase;
  firestore?: Firestore;
  now?: () => string;
}

const ROOM_MEMBERSHIPS_COLLECTION = "roomMemberships";
const PENDING_PAIR_LINKS_COLLECTION = "pendingPairLinks";
const PAIR_CODES_COLLECTION = "pairCodes";
const SHARED_ROOMS_COLLECTION = "sharedRooms";
const PENDING_LINK_TTL_MS = 10 * 60 * 1000;

class FirebaseOwnershipStoreError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FirebaseOwnershipStoreError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createTimestamp(nowIso?: string | number | Date): string {
  if (!nowIso) {
    return new Date().toISOString();
  }

  if (typeof nowIso === "number") {
    return Number.isFinite(nowIso)
      ? new Date(nowIso).toISOString()
      : new Date().toISOString();
  }

  if (nowIso instanceof Date) {
    return new Date(nowIso.getTime()).toISOString();
  }

  const parsed = Date.parse(nowIso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function nowFrom(options: FirebaseOwnershipStoreOptions): string {
  return createTimestamp(options.now?.());
}

function validateFirebasePairCodeRecord(value: unknown): FirebasePairCodeRecord {
  if (
    !isRecord(value) ||
    typeof value.playerId !== "string" ||
    typeof value.pairCode !== "string" ||
    typeof value.displayName !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw new Error("Invalid Firebase pair code record");
  }

  return {
    playerId: value.playerId,
    pairCode: normalizePairCode(value.pairCode),
    displayName: value.displayName,
    updatedAt: value.updatedAt
  };
}

function createPairCodeCandidate(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function createPendingLinkId(playerIds: readonly string[]): string {
  return `pending:${[...playerIds].sort().join(":")}`;
}

function buildSharedRoomMembers(
  pendingLink: SharedPendingPairLink,
  nowIso: string
): { memberIds: string[]; members: SharedRoomMember[] } {
  const participantIds = rejectInvalidPairParticipants(pendingLink.playerIds);
  const creatorPlayerId = participantIds.includes(pendingLink.submittedByPlayerId)
    ? pendingLink.submittedByPlayerId
    : participantIds[0];
  const orderedPlayerIds = [
    creatorPlayerId,
    participantIds.find((playerId) => playerId !== creatorPlayerId) ?? participantIds[0]
  ];

  return {
    memberIds: orderedPlayerIds,
    members: orderedPlayerIds.map((playerId, index) => ({
      playerId,
      displayName: pendingLink.playerDisplayNamesById?.[playerId] ?? playerId,
      role: index === 0 ? "creator" : "partner",
      joinedAt: nowIso
    }))
  };
}

function buildStarterRoomArtifacts(input: {
  actorPlayerId: string;
  nowIso: string;
  pendingLink: SharedPendingPairLink;
  pairCodeRecords: Map<string, FirebasePairCodeRecord>;
}): {
  roomDocument: SharedRoomDocument;
  memberships: Record<string, SharedRoomMembership>;
} {
  const { actorPlayerId, nowIso, pendingLink, pairCodeRecords } = input;
  const roomId = `shared-room-${crypto.randomUUID()}`;
  const roomState = createSharedRoomSeed(roomId, createDefaultRoomState());
  const { memberIds, members } = buildSharedRoomMembers(pendingLink, nowIso);
  const sharedPet = createSharedRoomPetRecord(
    pickPetSpawnPosition(DEFAULT_PLAYER_POSITION, roomState.furniture),
    actorPlayerId,
    nowIso
  );
  const roomDocument = validateSharedRoomDocument({
    roomId,
    inviteCode: pendingLink.targetPairCode,
    memberIds,
    members,
    revision: 1,
    progression: createInitialSharedRoomProgression(memberIds, members, 0, nowIso),
    seedKind: "starter-room",
    createdAt: nowIso,
    updatedAt: nowIso,
    roomState,
    frameMemories: {},
    sharedPet
  });
  const memberships = Object.fromEntries(
    memberIds.map((playerId) => {
      const pairCodeRecord = pairCodeRecords.get(playerId);
      const partnerPlayerId = memberIds.find((entry) => entry !== playerId) ?? playerId;

      if (!pairCodeRecord) {
        throw new Error("Missing pair code record during pair finalization.");
      }

      return [
        playerId,
        validateSharedRoomMembership({
          playerId,
          roomId,
          partnerPlayerId,
          pairCode: pairCodeRecord.pairCode,
          pairedAt: nowIso
        })
      ] as const;
    })
  );

  return {
    roomDocument,
    memberships
  };
}

function createNeedsLinkingState(
  profile: SharedPlayerProfile,
  pairCodeRecord: FirebasePairCodeRecord
): SharedRoomBootstrapState {
  return deriveSharedRoomBootstrapState({
    playerId: profile.playerId,
    selfPairCode: pairCodeRecord.pairCode
  });
}

export function createEmptyFirebaseHostedDatabase(): FirebaseHostedDatabase {
  return {
    roomMemberships: {},
    pendingPairLinks: {},
    pairCodes: {},
    sharedRooms: {},
    roomPresence: {},
    roomLocks: {},
    pairLinkPresence: {}
  };
}

function createMemoryPairCodeRecord(
  database: FirebaseHostedDatabase,
  profile: SharedPlayerProfile,
  nowIso: string
): FirebasePairCodeRecord {
  const existingRecord = database.pairCodes[profile.playerId];

  if (existingRecord) {
    const nextRecord = {
      ...existingRecord,
      displayName: profile.displayName,
      updatedAt: nowIso
    };
    database.pairCodes[profile.playerId] = nextRecord;
    return nextRecord;
  }

  let pairCode = createPairCodeCandidate();

  while (Object.values(database.pairCodes).some((record) => record.pairCode === pairCode)) {
    pairCode = createPairCodeCandidate();
  }

  const nextRecord = {
    playerId: profile.playerId,
    pairCode,
    displayName: profile.displayName,
    updatedAt: nowIso
  };
  database.pairCodes[profile.playerId] = nextRecord;
  return nextRecord;
}

function findMemoryPendingLinkForPlayer(
  database: FirebaseHostedDatabase,
  playerId: string
): SharedPendingPairLink | null {
  return (
    Object.values(database.pendingPairLinks).find((pendingLink) =>
      pendingLink.playerIds.includes(playerId)
    ) ?? null
  );
}

function buildMemoryBootstrapState(
  database: FirebaseHostedDatabase,
  profile: SharedPlayerProfile,
  nowIso: string
): SharedRoomBootstrapState {
  const pairCodeRecord = createMemoryPairCodeRecord(database, profile, nowIso);
  const membership = database.roomMemberships[profile.playerId] ?? null;

  if (membership) {
    return deriveSharedRoomBootstrapState({
      playerId: profile.playerId,
      selfPairCode: pairCodeRecord.pairCode,
      membership
    });
  }

  const pendingLink = findMemoryPendingLinkForPlayer(database, profile.playerId);

  return deriveSharedRoomBootstrapState({
    playerId: profile.playerId,
    selfPairCode: pairCodeRecord.pairCode,
    pendingLink
  });
}

function createMemoryOwnershipStore(
  options: Required<Pick<FirebaseOwnershipStoreOptions, "database" | "now">>
): SharedRoomOwnershipStore {
  const { database } = options;

  return {
    async loadBootstrapState(input: LoadSharedRoomBootstrapStateInput) {
      return buildMemoryBootstrapState(database, input.profile, createTimestamp(options.now()));
    },
    async submitPairCode(input: SubmitPairCodeInput) {
      const nowIso = createTimestamp(options.now());
      const actorPairCode = createMemoryPairCodeRecord(database, input.profile, nowIso);
      const targetPairCode = normalizePairCode(input.pairCode);
      const targetRecord =
        Object.values(database.pairCodes).find((record) => record.pairCode === targetPairCode) ??
        null;

      if (!targetRecord) {
        throw new FirebaseOwnershipStoreError("Partner code was not found.", 404);
      }

      const participantIds = assertPairLinkSubmissionAllowed({
        actorPlayerId: input.profile.playerId,
        targetPlayerId: targetRecord.playerId,
        actorMembership: database.roomMemberships[input.profile.playerId] ?? null,
        targetMembership: database.roomMemberships[targetRecord.playerId] ?? null
      });

      if (targetPairCode === actorPairCode.pairCode) {
        throw new FirebaseOwnershipStoreError(
          "Pair link requires two different players.",
          409
        );
      }

      const pendingLinkId = createPendingLinkId(participantIds);
      const pendingLink = validateSharedPendingPairLink({
        pendingLinkId,
        playerIds: participantIds,
        submittedByPlayerId: input.profile.playerId,
        targetPairCode,
        confirmationsByPlayerId: Object.fromEntries(
          participantIds.map((playerId) => [playerId, false])
        ),
        expiresAt: createTimestamp(
          new Date(nowIso).getTime() + PENDING_LINK_TTL_MS
        ),
        playerDisplayNamesById: {
          [input.profile.playerId]: input.profile.displayName,
          [targetRecord.playerId]: targetRecord.displayName
        }
      });

      database.pendingPairLinks[pendingLinkId] = pendingLink;

      return deriveSharedRoomBootstrapState({
        playerId: input.profile.playerId,
        selfPairCode: actorPairCode.pairCode,
        pendingLink
      });
    },
    async confirmPairLink(input: ConfirmPairLinkInput) {
      const nowIso = createTimestamp(options.now());
      const actorPairCode = createMemoryPairCodeRecord(database, input.profile, nowIso);
      const existingPendingLink = database.pendingPairLinks[input.pendingLinkId];

      if (!existingPendingLink) {
        throw new FirebaseOwnershipStoreError("Pending pair link was not found.", 404);
      }

      if (!existingPendingLink.playerIds.includes(input.profile.playerId)) {
        throw new FirebaseOwnershipStoreError(
          "Pending pair link does not belong to this player.",
          403
        );
      }

      if (existingPendingLink.playerIds.some((playerId) => database.roomMemberships[playerId])) {
        throw new FirebaseOwnershipStoreError(
          "Already paired accounts cannot start a new couple room link.",
          409
        );
      }

      const nextPendingLink = validateSharedPendingPairLink({
        ...existingPendingLink,
        confirmationsByPlayerId: {
          ...existingPendingLink.confirmationsByPlayerId,
          [input.profile.playerId]: true
        },
        playerDisplayNamesById: {
          ...existingPendingLink.playerDisplayNamesById,
          [input.profile.playerId]: input.profile.displayName
        }
      });

      if (!isPendingPairLinkReady(nextPendingLink, nowIso)) {
        database.pendingPairLinks[input.pendingLinkId] = nextPendingLink;
        return deriveSharedRoomBootstrapState({
          playerId: input.profile.playerId,
          selfPairCode: actorPairCode.pairCode,
          pendingLink: nextPendingLink
        });
      }

      const pairCodeRecords = new Map(
        nextPendingLink.playerIds.map((playerId) => {
          const pairCodeRecord = database.pairCodes[playerId];

          if (!pairCodeRecord) {
            throw new Error("Missing pair code record during pair finalization.");
          }

          return [playerId, pairCodeRecord] as const;
        })
      );
      const { roomDocument, memberships } = buildStarterRoomArtifacts({
        actorPlayerId: input.profile.playerId,
        nowIso,
        pendingLink: nextPendingLink,
        pairCodeRecords
      });

      database.sharedRooms[roomDocument.roomId] = roomDocument;
      Object.assign(database.roomMemberships, memberships);
      delete database.pendingPairLinks[input.pendingLinkId];

      return deriveSharedRoomBootstrapState({
        playerId: input.profile.playerId,
        selfPairCode: actorPairCode.pairCode,
        membership: memberships[input.profile.playerId]
      });
    },
    async cancelPairLink(input) {
      const nowIso = createTimestamp(options.now());
      const actorPairCode = createMemoryPairCodeRecord(database, input.profile, nowIso);
      const existingPendingLink = database.pendingPairLinks[input.pendingLinkId];

      if (existingPendingLink?.playerIds.includes(input.profile.playerId)) {
        delete database.pendingPairLinks[input.pendingLinkId];
      }

      return createNeedsLinkingState(input.profile, actorPairCode);
    }
  };
}

async function getOrCreateFirestorePairCodeRecord(
  firestore: Firestore,
  profile: SharedPlayerProfile,
  nowIso: string
): Promise<FirebasePairCodeRecord> {
  const pairCodeRef = doc(collection(firestore, PAIR_CODES_COLLECTION), profile.playerId);
  const pairCodeSnapshot = await getDoc(pairCodeRef);

  if (pairCodeSnapshot.exists()) {
    const existingRecord = validateFirebasePairCodeRecord(pairCodeSnapshot.data());
    const nextRecord = {
      ...existingRecord,
      displayName: profile.displayName,
      updatedAt: nowIso
    };
    await setDoc(pairCodeRef, nextRecord);
    return nextRecord;
  }

  let candidate = createPairCodeCandidate();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidateQuery = query(
      collection(firestore, PAIR_CODES_COLLECTION),
      where("pairCode", "==", candidate)
    );
    const candidateMatches = await getDocs(candidateQuery);

    if (candidateMatches.empty) {
      const nextRecord = {
        playerId: profile.playerId,
        pairCode: candidate,
        displayName: profile.displayName,
        updatedAt: nowIso
      };
      await setDoc(pairCodeRef, nextRecord);
      return nextRecord;
    }

    candidate = createPairCodeCandidate();
  }

  throw new FirebaseOwnershipStoreError(
    "Could not generate a unique pair code right now.",
    503
  );
}

async function findFirestorePendingLinkForPlayer(
  firestore: Firestore,
  playerId: string
): Promise<SharedPendingPairLink | null> {
  const pendingLinkQuery = query(
    collection(firestore, PENDING_PAIR_LINKS_COLLECTION),
    where("playerIds", "array-contains", playerId)
  );
  const pendingLinkSnapshots = await getDocs(pendingLinkQuery);
  const firstMatch = pendingLinkSnapshots.docs[0];

  return firstMatch ? validateSharedPendingPairLink(firstMatch.data()) : null;
}

export function createFirebaseOwnershipStore(
  options: FirebaseOwnershipStoreOptions = {}
): SharedRoomOwnershipStore {
  if (options.database) {
    const memoryStore = createMemoryOwnershipStore({
      database: options.database,
      now: options.now ?? (() => new Date().toISOString())
    });

    return {
      loadBootstrapState(input) {
        return memoryStore.loadBootstrapState(input);
      },
      submitPairCode(input) {
        return memoryStore.submitPairCode(input);
      },
      confirmPairLink(input) {
        return memoryStore.confirmPairLink(input);
      },
      cancelPairLink(input) {
        return memoryStore.cancelPairLink(input);
      }
    };
  }

  const firestore = options.firestore ?? getFirestore(getFirebaseApp());
  const now = () => nowFrom(options);

  return {
    async loadBootstrapState(input) {
      const nowIso = now();
      const pairCodeRecord = await getOrCreateFirestorePairCodeRecord(
        firestore,
        input.profile,
        nowIso
      );
      const membershipSnapshot = await getDoc(
        doc(collection(firestore, ROOM_MEMBERSHIPS_COLLECTION), input.profile.playerId)
      );

      if (membershipSnapshot.exists()) {
        return deriveSharedRoomBootstrapState({
          playerId: input.profile.playerId,
          selfPairCode: pairCodeRecord.pairCode,
          membership: validateSharedRoomMembership(membershipSnapshot.data())
        });
      }

      const pendingLink = await findFirestorePendingLinkForPlayer(
        firestore,
        input.profile.playerId
      );

      return deriveSharedRoomBootstrapState({
        playerId: input.profile.playerId,
        selfPairCode: pairCodeRecord.pairCode,
        pendingLink
      });
    },
    async submitPairCode(input) {
      const nowIso = now();
      const actorPairCode = await getOrCreateFirestorePairCodeRecord(
        firestore,
        input.profile,
        nowIso
      );
      const targetPairCode = normalizePairCode(input.pairCode);

      if (targetPairCode === actorPairCode.pairCode) {
        throw new FirebaseOwnershipStoreError(
          "Pair link requires two different players.",
          409
        );
      }

      const targetPairCodeQuery = query(
        collection(firestore, PAIR_CODES_COLLECTION),
        where("pairCode", "==", targetPairCode)
      );
      const targetPairCodeSnapshots = await getDocs(targetPairCodeQuery);
      const targetPairCodeSnapshot = targetPairCodeSnapshots.docs[0];

      if (!targetPairCodeSnapshot) {
        throw new FirebaseOwnershipStoreError("Partner code was not found.", 404);
      }

      const targetRecord = validateFirebasePairCodeRecord(targetPairCodeSnapshot.data());
      const [actorMembershipSnapshot, targetMembershipSnapshot] = await Promise.all([
        getDoc(doc(collection(firestore, ROOM_MEMBERSHIPS_COLLECTION), input.profile.playerId)),
        getDoc(doc(collection(firestore, ROOM_MEMBERSHIPS_COLLECTION), targetRecord.playerId))
      ]);
      const participantIds = assertPairLinkSubmissionAllowed({
        actorPlayerId: input.profile.playerId,
        targetPlayerId: targetRecord.playerId,
        actorMembership: actorMembershipSnapshot.exists()
          ? validateSharedRoomMembership(actorMembershipSnapshot.data())
          : null,
        targetMembership: targetMembershipSnapshot.exists()
          ? validateSharedRoomMembership(targetMembershipSnapshot.data())
          : null
      });
      const pendingLinkId = createPendingLinkId(participantIds);
      const pendingLink = validateSharedPendingPairLink({
        pendingLinkId,
        playerIds: participantIds,
        submittedByPlayerId: input.profile.playerId,
        targetPairCode,
        confirmationsByPlayerId: Object.fromEntries(
          participantIds.map((playerId) => [playerId, false])
        ),
        expiresAt: createTimestamp(
          new Date(nowIso).getTime() + PENDING_LINK_TTL_MS
        ),
        playerDisplayNamesById: {
          [input.profile.playerId]: input.profile.displayName,
          [targetRecord.playerId]: targetRecord.displayName
        }
      });

      await setDoc(
        doc(collection(firestore, PENDING_PAIR_LINKS_COLLECTION), pendingLinkId),
        pendingLink
      );

      return deriveSharedRoomBootstrapState({
        playerId: input.profile.playerId,
        selfPairCode: actorPairCode.pairCode,
        pendingLink
      });
    },
    async confirmPairLink(input) {
      const nowIso = now();
      const actorPairCode = await getOrCreateFirestorePairCodeRecord(
        firestore,
        input.profile,
        nowIso
      );

      return runTransaction(firestore, async (transaction) => {
        const pendingLinkRef = doc(
          collection(firestore, PENDING_PAIR_LINKS_COLLECTION),
          input.pendingLinkId
        );
        const pendingLinkSnapshot = await transaction.get(pendingLinkRef);

        if (!pendingLinkSnapshot.exists()) {
          throw new FirebaseOwnershipStoreError("Pending pair link was not found.", 404);
        }

        const pendingLink = validateSharedPendingPairLink(pendingLinkSnapshot.data());

        if (!pendingLink.playerIds.includes(input.profile.playerId)) {
          throw new FirebaseOwnershipStoreError(
            "Pending pair link does not belong to this player.",
            403
          );
        }

        const membershipRefs = pendingLink.playerIds.map((playerId) =>
          doc(collection(firestore, ROOM_MEMBERSHIPS_COLLECTION), playerId)
        );
        const membershipSnapshots = await Promise.all(
          membershipRefs.map((membershipRef) => transaction.get(membershipRef))
        );

        if (membershipSnapshots.some((membershipSnapshot) => membershipSnapshot.exists())) {
          throw new FirebaseOwnershipStoreError(
            "Already paired accounts cannot start a new couple room link.",
            409
          );
        }

        const nextPendingLink = validateSharedPendingPairLink({
          ...pendingLink,
          confirmationsByPlayerId: {
            ...pendingLink.confirmationsByPlayerId,
            [input.profile.playerId]: true
          },
          playerDisplayNamesById: {
            ...pendingLink.playerDisplayNamesById,
            [input.profile.playerId]: input.profile.displayName
          }
        });

        if (!isPendingPairLinkReady(nextPendingLink, nowIso)) {
          transaction.set(pendingLinkRef, nextPendingLink);
          return deriveSharedRoomBootstrapState({
            playerId: input.profile.playerId,
            selfPairCode: actorPairCode.pairCode,
            pendingLink: nextPendingLink
          });
        }

        const pairCodeRefs = nextPendingLink.playerIds.map((playerId) =>
          doc(collection(firestore, PAIR_CODES_COLLECTION), playerId)
        );
        const pairCodeSnapshots = await Promise.all(
          pairCodeRefs.map((pairCodeRef) => transaction.get(pairCodeRef))
        );
        const pairCodeRecords = new Map(
          pairCodeSnapshots.map((pairCodeSnapshot) => {
            if (!pairCodeSnapshot.exists()) {
              throw new FirebaseOwnershipStoreError(
                "Pair code metadata is missing for one of the participants.",
                409
              );
            }

            const pairCodeRecord = validateFirebasePairCodeRecord(pairCodeSnapshot.data());
            return [pairCodeRecord.playerId, pairCodeRecord] as const;
          })
        );
        const { roomDocument, memberships } = buildStarterRoomArtifacts({
          actorPlayerId: input.profile.playerId,
          nowIso,
          pendingLink: nextPendingLink,
          pairCodeRecords
        });

        transaction.set(
          doc(collection(firestore, SHARED_ROOMS_COLLECTION), roomDocument.roomId),
          roomDocument
        );

        Object.entries(memberships).forEach(([playerId, membership]) => {
          transaction.set(
            doc(collection(firestore, ROOM_MEMBERSHIPS_COLLECTION), playerId),
            membership
          );
        });

        transaction.delete(pendingLinkRef);

        return deriveSharedRoomBootstrapState({
          playerId: input.profile.playerId,
          selfPairCode: actorPairCode.pairCode,
          membership: memberships[input.profile.playerId]
        });
      });
    },
    async cancelPairLink(input) {
      const nowIso = now();
      const actorPairCode = await getOrCreateFirestorePairCodeRecord(
        firestore,
        input.profile,
        nowIso
      );
      const pendingLinkRef = doc(
        collection(firestore, PENDING_PAIR_LINKS_COLLECTION),
        input.pendingLinkId
      );
      const pendingLinkSnapshot = await getDoc(pendingLinkRef);

      if (pendingLinkSnapshot.exists()) {
        const pendingLink = validateSharedPendingPairLink(pendingLinkSnapshot.data());

        if (pendingLink.playerIds.includes(input.profile.playerId)) {
          await deleteDoc(pendingLinkRef);
        }
      }

      return createNeedsLinkingState(input.profile, actorPairCode);
    }
  };
}
