import type { SharedRoomBlockingState } from "./runtimeTypes";

export const HOSTED_LOADING_TITLE = "Loading your room...";
export const HOSTED_VERIFY_ERROR_TITLE = "We couldn't verify your room right now.";
export const HOSTED_UNAVAILABLE_TITLE = "Hosted couple room setup is incomplete.";
export const PENDING_LINK_POLL_INTERVAL_MS = 1000;
export const ROOM_PASSIVE_SYNC_INTERVAL_MS = 1000;

export function getSharedRoomErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Shared room request failed.";
}

export function createBlockingState(
  title: string,
  body: string,
  retryable = false
): SharedRoomBlockingState {
  return {
    title,
    body,
    retryable
  };
}

export function createHostedUnavailableBody(missingKeys: readonly string[]): string {
  if (missingKeys.length === 0) {
    return "Google sign-in and hosted couple linking are unavailable until the hosted backend is configured.";
  }

  return `Missing Firebase setup: ${missingKeys.join(", ")}. Finish the hosted env config before testing Google sign-in and couple linking.`;
}