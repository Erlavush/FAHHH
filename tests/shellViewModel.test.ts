import { describe, expect, it } from "vitest";
import {
  getDefaultShellViewMode,
  getDeveloperQuickActions,
  getDeveloperSessionPanelState,
  getDeveloperWorkspaceTabState,
  getDeveloperWorkspaceTabs,
  getPlayerActionDockState,
  getPlayerCompanionCardState,
  getPlayerRoomDetailsState
} from "../src/app/shellViewModel";
import type { SharedPresenceStatus } from "../src/app/hooks/useSharedRoomPresence";
import type { SharedRitualStatusView } from "../src/lib/sharedProgression";

function createPresenceStatus(
  title: SharedPresenceStatus["title"]
): SharedPresenceStatus {
  return {
    title,
    body: `${title} body`,
    isBlocking: false,
    tone: title === "Partner reconnecting" ? "attention" : "success"
  };
}

function createRitualStatus(
  ritualComplete: boolean,
  streakCount = 3
): SharedRitualStatusView {
  return {
    title: ritualComplete ? "Streak protected" : "Streak 3",
    body: "ritual body",
    tone: ritualComplete ? "success" : "attention",
    streakCount,
    ritualComplete,
    selfCompleted: ritualComplete,
    partnerCompleted: ritualComplete
  };
}

describe("shellViewModel", () => {
  it("returns developer as the first-time default shell mode in dev", () => {
    expect(getDefaultShellViewMode(true)).toBe("developer");
    expect(getDefaultShellViewMode(true, "player")).toBe("player");
  });

  it("returns player as the shell mode outside dev", () => {
    expect(getDefaultShellViewMode(false)).toBe("player");
    expect(getDefaultShellViewMode(false, "developer")).toBe("player");
  });

  it("returns developer workspace tabs in contract order", () => {
    expect(getDeveloperWorkspaceTabs().map((tab) => tab.label)).toEqual([
      "Room",
      "Inventory",
      "Preview Studio",
      "Mob Lab",
      "World",
      "Session"
    ]);
    expect(getDeveloperWorkspaceTabState("world").find((tab) => tab.isActive)?.label).toBe("World");
  });

  it("returns player companion card copy", () => {
    const waitingState = getPlayerCompanionCardState({
      inviteCode: "ABCD12",
      memberCount: 1,
      presenceStatus: createPresenceStatus("Waiting for partner"),
      ritualStatus: createRitualStatus(false),
      showInviteCode: true,
      statusMessage: null
    });
    const togetherState = getPlayerCompanionCardState({
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Together now"),
      ritualStatus: createRitualStatus(true),
      showInviteCode: false,
      statusMessage: null
    });
    const reconnectingState = getPlayerCompanionCardState({
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Partner reconnecting"),
      ritualStatus: createRitualStatus(false),
      showInviteCode: false,
      statusMessage: "Reloading latest room..."
    });

    expect(waitingState.partnerTitle).toBe("Waiting for partner");
    expect(waitingState.ritualTitle).toBe("Daily ritual pending");
    expect(togetherState.partnerTitle).toBe("Together now");
    expect(togetherState.ritualTitle).toBe("Daily ritual complete");
    expect(reconnectingState.partnerTitle).toBe("Reconnecting");
  });

  it("keeps room details actions secondary and player-safe", () => {
    const detailsState = getPlayerRoomDetailsState({
      gridSnapEnabled: true,
      inviteCode: "ABCD12",
      memberCount: 1,
      roomId: "room-1",
      sharedRoomActive: true
    });

    expect(detailsState.secondaryActions.map((action) => action.label)).toContain("Refresh room state");
    expect(detailsState.secondaryActions.map((action) => action.label)).toContain("Copy invite code");
  });

  it("does not expose developer actions in the player dock", () => {
    const dockState = getPlayerActionDockState({
      buildModeEnabled: false,
      catalogOpen: false,
      playerInteractionStatus: null
    });

    expect(dockState.actions.map((action) => action.label)).toEqual([
      "Enter Build Mode",
      "Open Inventory"
    ]);
    expect(dockState.actions.map((action) => action.label)).not.toContain("Refresh room state");
    expect(dockState.actions.map((action) => action.label)).not.toContain("Preview Studio");
    expect(dockState.actions.map((action) => action.label)).not.toContain("Dev Panel");
  });

  it("keeps developer quick actions out of the player dock", () => {
    const quickActions = getDeveloperQuickActions(true).map((action) => action.label);
    const playerDock = getPlayerActionDockState({
      buildModeEnabled: true,
      catalogOpen: true,
      playerInteractionStatus: null
    }).actions.map((action) => action.label);

    expect(quickActions).toEqual([
      "Refresh room state",
      "Reset camera",
      "Reset sandbox"
    ]);
    expect(playerDock).not.toContain("Refresh room state");
    expect(playerDock).not.toContain("Reset camera");
    expect(playerDock).not.toContain("Reset sandbox");
  });

  it("derives developer session panel copy", () => {
    const state = getDeveloperSessionPanelState({
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Together now"),
      roomId: "room-1",
      statusMessage: "Saving shared room..."
    });

    expect(state.roomId).toBe("room-1");
    expect(state.inviteCode).toBe("ABCD12");
    expect(state.memberCountLabel).toBe("2 members");
    expect(state.presenceTitle).toBe("Together now");
    expect(state.syncStatus).toBe("Saving shared room...");
  });
});
