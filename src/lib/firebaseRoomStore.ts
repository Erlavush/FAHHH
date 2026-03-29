import { doc, getDoc, getFirestore, runTransaction, type Firestore } from "firebase/firestore";
import { advanceRitualDayIfNeeded } from "./sharedProgression";
import { getFirebaseApp } from "./firebaseApp";
import type { FirebaseHostedDatabase } from "./firebaseOwnershipStore";
import type {
  BootstrapDevSharedRoomInput,
  CommitSharedRoomStateInput,
  CreateSharedRoomInput,
  JoinSharedRoomInput,
  LoadSharedRoomInput,
  SharedRoomStore
} from "./sharedRoomStore";
import { validateSharedRoomDocument } from "./sharedRoomValidation";

export interface FirebaseRoomStoreOptions {
  database?: FirebaseHostedDatabase;
  firestore?: Firestore;
  now?: () => string;
}

class FirebaseRoomStoreError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FirebaseRoomStoreError";
    this.status = status;
  }
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

function buildCommittedRoomDocument(
  input: CommitSharedRoomStateInput,
  existingRoomDocument: ReturnType<typeof validateSharedRoomDocument>,
  nowIso: string
) {
  return validateSharedRoomDocument({
    ...existingRoomDocument,
    revision: existingRoomDocument.revision + 1,
    progression: advanceRitualDayIfNeeded(
      input.progression,
      existingRoomDocument.memberIds,
      existingRoomDocument.members,
      nowIso
    ),
    updatedAt: nowIso,
    roomState: {
      ...input.roomState,
      metadata: {
        ...input.roomState.metadata,
        roomId: existingRoomDocument.roomId
      }
    },
    frameMemories: input.frameMemories,
    sharedPets: input.sharedPets
  });
}

function unsupportedRoomFlow(methodName: string): Promise<never> {
  return Promise.reject(
    new Error(
      `Firebase room store does not support ${methodName}; use hosted ownership bootstrap instead.`
    )
  );
}

export function createFirebaseRoomStore(
  options: FirebaseRoomStoreOptions = {}
): SharedRoomStore {
  const now = () => createTimestamp(options.now?.());

  if (options.database) {
    const database = options.database;

    return {
      bootstrapDevSharedRoom(_input: BootstrapDevSharedRoomInput) {
        return unsupportedRoomFlow("bootstrapDevSharedRoom");
      },
      createSharedRoom(_input: CreateSharedRoomInput) {
        return unsupportedRoomFlow("createSharedRoom");
      },
      joinSharedRoom(_input: JoinSharedRoomInput) {
        return unsupportedRoomFlow("joinSharedRoom");
      },
      async loadSharedRoom(input: LoadSharedRoomInput) {
        const roomDocument = database.sharedRooms[input.roomId];

        if (!roomDocument) {
          throw new FirebaseRoomStoreError("Shared room not found.", 404);
        }

        return validateSharedRoomDocument(roomDocument);
      },
      async commitSharedRoomState(input: CommitSharedRoomStateInput) {
        const existingRoomDocument = database.sharedRooms[input.roomId];

        if (!existingRoomDocument) {
          throw new FirebaseRoomStoreError("Shared room not found.", 404);
        }

        if (existingRoomDocument.revision !== input.expectedRevision) {
          throw new FirebaseRoomStoreError("Shared room revision conflict.", 409);
        }

        const nextRoomDocument = buildCommittedRoomDocument(
          input,
          validateSharedRoomDocument(existingRoomDocument),
          now()
        );

        database.sharedRooms[input.roomId] = nextRoomDocument;
        return nextRoomDocument;
      }
    };
  }

  const firestore = options.firestore ?? getFirestore(getFirebaseApp());

  return {
    bootstrapDevSharedRoom(_input: BootstrapDevSharedRoomInput) {
      return unsupportedRoomFlow("bootstrapDevSharedRoom");
    },
    createSharedRoom(_input: CreateSharedRoomInput) {
      return unsupportedRoomFlow("createSharedRoom");
    },
    joinSharedRoom(_input: JoinSharedRoomInput) {
      return unsupportedRoomFlow("joinSharedRoom");
    },
    async loadSharedRoom(input: LoadSharedRoomInput) {
      const roomSnapshot = await getDoc(doc(firestore, "sharedRooms", input.roomId));

      if (!roomSnapshot.exists()) {
        throw new FirebaseRoomStoreError("Shared room not found.", 404);
      }

      return validateSharedRoomDocument(roomSnapshot.data());
    },
    async commitSharedRoomState(input: CommitSharedRoomStateInput) {
      return runTransaction(firestore, async (transaction) => {
        const roomRef = doc(firestore, "sharedRooms", input.roomId);
        const roomSnapshot = await transaction.get(roomRef);

        if (!roomSnapshot.exists()) {
          throw new FirebaseRoomStoreError("Shared room not found.", 404);
        }

        const existingRoomDocument = validateSharedRoomDocument(roomSnapshot.data());

        if (existingRoomDocument.revision !== input.expectedRevision) {
          throw new FirebaseRoomStoreError("Shared room revision conflict.", 409);
        }

        const nextRoomDocument = buildCommittedRoomDocument(
          input,
          existingRoomDocument,
          now()
        );

        transaction.set(roomRef, nextRoomDocument);
        return nextRoomDocument;
      });
    }
  };
}
