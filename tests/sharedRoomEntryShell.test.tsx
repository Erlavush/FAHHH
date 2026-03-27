// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedRoomEntryShell } from "../src/app/components/SharedRoomEntryShell";
import type { SharedPairLinkPresenceSnapshot } from "../src/lib/sharedPresenceTypes";
import type { SharedPendingPairLink } from "../src/lib/sharedRoomTypes";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function createPendingLink(
  overrides: Partial<SharedPendingPairLink> = {}
): SharedPendingPairLink {
  return {
    pendingLinkId: overrides.pendingLinkId ?? "pending:player-1:player-2",
    playerIds: overrides.playerIds ?? ["player-1", "player-2"],
    submittedByPlayerId: overrides.submittedByPlayerId ?? "player-1",
    targetPairCode: overrides.targetPairCode ?? "BEA12345",
    confirmationsByPlayerId:
      overrides.confirmationsByPlayerId ?? {
        "player-1": false,
        "player-2": false
      },
    expiresAt: overrides.expiresAt ?? "2026-03-27T01:10:00.000Z",
    playerDisplayNamesById:
      overrides.playerDisplayNamesById ?? {
        "player-1": "Ari",
        "player-2": "Bea"
      }
  };
}

function createPairLinkPresence(
  pendingLinkId: string,
  playerIds: string[] = ["player-1", "player-2"]
): SharedPairLinkPresenceSnapshot {
  return {
    pendingLinkId,
    updatedAt: "2026-03-27T01:00:00.000Z",
    presences: playerIds.map((playerId) => ({
      pendingLinkId,
      playerId,
      displayName: playerId === "player-1" ? "Ari" : "Bea",
      updatedAt: "2026-03-27T01:00:00.000Z"
    }))
  };
}

async function renderShell(node: ReturnType<typeof createElement>) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(node);
  });
}

function queryButton(label: string): HTMLButtonElement | null {
  return (
    Array.from(container?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent?.trim() === label
    ) ?? null
  ) as HTMLButtonElement | null;
}

describe("SharedRoomEntryShell", () => {
  beforeEach(() => {
    container = null;
    root = null;
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;

    if (container) {
      container.remove();
    }

    container = null;
    vi.restoreAllMocks();
  });

  it("shows Google sign-in before any pair-code controls", async () => {
    await renderShell(
      createElement(SharedRoomEntryShell, {
        mode: "hosted",
        bootstrapKind: "signed_out",
        displayName: "Ari",
        errorMessage: null,
        pairLinkPresence: null,
        pendingLink: null,
        playerId: null,
        selfPairCode: null,
        onCancelPairLink: vi.fn(),
        onConfirmPairLink: vi.fn(),
        onSignInWithGoogle: vi.fn(),
        onSignOut: vi.fn(),
        onSubmitPartnerCode: vi.fn()
      })
    );

    expect(queryButton("Continue with Google")).not.toBeNull();
    expect(queryButton("Submit partner code")).toBeNull();
    expect(container?.textContent).not.toContain("Partner code");
  });

  it("surfaces hosted setup errors instead of pretending sign-in is ready", async () => {
    await renderShell(
      createElement(SharedRoomEntryShell, {
        mode: "hosted_unavailable",
        detail:
          "Missing Firebase setup: VITE_FIREBASE_API_KEY. Finish the hosted env config before testing Google sign-in and couple linking.",
        errorMessage: null
      })
    );

    expect(container?.textContent).toContain("Finish hosted setup before sign-in");
    expect(container?.textContent).toContain("Missing Firebase setup");
    expect(queryButton("Continue with Google")).toBeNull();
  });

  it("renders the confirm-link state after code submission", async () => {
    const pendingLink = createPendingLink();

    await renderShell(
      createElement(SharedRoomEntryShell, {
        mode: "hosted",
        bootstrapKind: "pending_link",
        displayName: "Ari",
        errorMessage: null,
        pairLinkPresence: createPairLinkPresence(pendingLink.pendingLinkId),
        pendingLink,
        playerId: "player-1",
        selfPairCode: "ARI12345",
        onCancelPairLink: vi.fn(),
        onConfirmPairLink: vi.fn(),
        onSignInWithGoogle: vi.fn(),
        onSignOut: vi.fn(),
        onSubmitPartnerCode: vi.fn()
      })
    );

    expect(container?.textContent).toContain("Ari");
    expect(container?.textContent).toContain("Bea");
    expect(queryButton("Confirm couple room")).not.toBeNull();
    expect(queryButton("Confirm couple room")?.disabled).toBe(false);
  });

  it("shows the waiting copy after the local partner confirms first", async () => {
    const pendingLink = createPendingLink({
      confirmationsByPlayerId: {
        "player-1": true,
        "player-2": false
      }
    });

    await renderShell(
      createElement(SharedRoomEntryShell, {
        mode: "hosted",
        bootstrapKind: "pending_link",
        displayName: "Ari",
        errorMessage: null,
        pairLinkPresence: createPairLinkPresence(pendingLink.pendingLinkId),
        pendingLink,
        playerId: "player-1",
        selfPairCode: "ARI12345",
        onCancelPairLink: vi.fn(),
        onConfirmPairLink: vi.fn(),
        onSignInWithGoogle: vi.fn(),
        onSignOut: vi.fn(),
        onSubmitPartnerCode: vi.fn()
      })
    );

    expect(container?.textContent).toContain("Waiting for your partner to confirm");
    expect(queryButton("Confirm couple room")).toBeNull();
    expect(queryButton("Cancel link")).not.toBeNull();
  });

  it("labels the legacy entry shell as the local fallback path", async () => {
    await renderShell(
      createElement(SharedRoomEntryShell, {
        mode: "legacy",
        displayName: "Ari",
        errorMessage: null,
        onCreateRoom: vi.fn(),
        onDisplayNameChange: vi.fn(),
        onJoinRoom: vi.fn()
      })
    );

    expect(container?.textContent).toContain("Local Shared Room");
    expect(container?.textContent).toContain("local fallback path");
    expect(queryButton("Create Shared Room")).not.toBeNull();
  });
});
