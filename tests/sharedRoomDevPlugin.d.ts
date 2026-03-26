declare module "../scripts/sharedRoomDevPlugin.mjs" {
  import type {
    CommitSharedRoomStateInput,
    CreateSharedRoomInput,
    JoinSharedRoomInput
  } from "../src/lib/sharedRoomStore";
  import type { SharedRoomDocument } from "../src/lib/sharedRoomTypes";

  export interface SharedRoomDevDatabase {
    profiles: Record<string, unknown>;
    invites: Record<string, unknown>;
    rooms: Record<string, SharedRoomDocument>;
  }

  export const SHARED_ROOM_DEV_DB_FILENAME: string;
  export function createEmptySharedRoomDevDatabase(): SharedRoomDevDatabase;
  export function createInviteCode(): string;
  export function loadSharedRoomDevDatabase(databasePath: string): Promise<SharedRoomDevDatabase>;
  export function writeSharedRoomDevDatabase(
    databasePath: string,
    database: SharedRoomDevDatabase
  ): Promise<void>;
  export function createSharedRoomInDatabase(
    database: SharedRoomDevDatabase,
    input: CreateSharedRoomInput
  ): SharedRoomDocument;
  export function loadSharedRoomInDatabase(
    database: SharedRoomDevDatabase,
    roomId: string
  ): SharedRoomDocument;
  export function joinSharedRoomInDatabase(
    database: SharedRoomDevDatabase,
    input: JoinSharedRoomInput
  ): SharedRoomDocument;
  export function commitSharedRoomStateInDatabase(
    database: SharedRoomDevDatabase,
    input: CommitSharedRoomStateInput
  ): SharedRoomDocument;
  export function sharedRoomDevPlugin(): {
    name: string;
    apply: "serve";
    configureServer(server: unknown): void;
  };
}
