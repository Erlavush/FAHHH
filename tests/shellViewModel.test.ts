import { describe, expect, it } from "vitest";
import {
  getDefaultShellViewMode,
  getDeveloperQuickActions,
  getDeveloperSessionPanelState,
  getDeveloperWorkspaceTabState,
  getDeveloperWorkspaceTabs,
  getPlayerActionDockState,
  getPlayerDrawerTabsState,
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
    tone:
      title === "Partner reconnecting"
        ? "attention"
        : title === "Partner away" || title === "Waiting for partner"
          ? "presence"
          : "success"
  };
}

function createRitualStatus(
  ritualComplete: boolean,
  streakCount = 3,
  overrides: Partial<SharedRitualStatusView> = {}
): SharedRitualStatusView {
  return {
    title: ritualComplete ? "Together Days 3" : "Together Days 3",
    body: "ritual body",
    tone: ritualComplete ? "success" : "attention",
    streakCount,
    ritualComplete,
    selfCompleted: ritualComplete,
    partnerCompleted: ritualComplete,
    ...overrides
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
  it("returns split drawer tabs for inventory, shop, and pet care", () => {
    const sandboxTabs = getPlayerDrawerTabsState("pet_care", false, 2);
    const sharedRoomTabs = getPlayerDrawerTabsState("inventory", true, 0);

    expect(sandboxTabs.map((tab) => tab.label)).toEqual([
      "Inventory",
      "Shop",
      "Pet Care"
    ]);
    expect(sandboxTabs.find((tab) => tab.value === "pet_care")).toMatchObject({
      isActive: true,
      badgeLabel: "2 need care"
    });
    expect(sharedRoomTabs.find((tab) => tab.value === "shop")?.description).toContain(
      "shared companion"
    );
    expect(sharedRoomTabs.find((tab) => tab.value === "pet_care")?.description).not.toContain(
      "tool"
    );
  });

  it("returns player companion card copy with Together Days and activity statuses", () => {
    const waitingState = getPlayerCompanionCardState({
      activeCatCount: 2,
      catsNeedingCareCount: 1,
      cozyRestPaidToday: false,
      cozyRestReadyNow: false,
      deskActivityPaidToday: false,
      deskActivityReadyNow: true,
      inviteCode: "ABCD12",
      memberCount: 1,
      presenceStatus: createPresenceStatus("Waiting for partner"),
      ritualStatus: createRitualStatus(false),
      runtimeEntryMode: "legacy",
      showInviteCode: true,
      statusMessage: null,
      storedCatCount: 1,
      togetherDaysCount: 3,
      visitCompletedToday: true
    });
    const togetherState = getPlayerCompanionCardState({
      activeCatCount: 3,
      catsNeedingCareCount: 0,
      cozyRestPaidToday: false,
      cozyRestReadyNow: true,
      deskActivityPaidToday: true,
      deskActivityReadyNow: false,
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Together now"),
      ritualStatus: createRitualStatus(true),
      runtimeEntryMode: "hosted",
      showInviteCode: false,
      statusMessage: null,
      storedCatCount: 2,
      togetherDaysCount: 8,
      visitCompletedToday: true
    });
    const reconnectingState = getPlayerCompanionCardState({
      activeCatCount: 1,
      catsNeedingCareCount: 1,
      cozyRestPaidToday: false,
      cozyRestReadyNow: false,
      deskActivityPaidToday: false,
      deskActivityReadyNow: true,
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Partner reconnecting"),
      ritualStatus: createRitualStatus(false, 3, {
        selfCompleted: true,
        partnerCompleted: false
      }),
      runtimeEntryMode: "dev_fallback",
      showInviteCode: false,
      statusMessage: "Reloading latest room...",
      storedCatCount: 0,
      togetherDaysCount: 3,
      visitCompletedToday: true
    });
    const awayState = getPlayerCompanionCardState({
      activeCatCount: 2,
      catsNeedingCareCount: 2,
      cozyRestPaidToday: false,
      cozyRestReadyNow: false,
      deskActivityPaidToday: false,
      deskActivityReadyNow: true,
      inviteCode: "ABCD12",
      memberCount: 2,
      presenceStatus: createPresenceStatus("Partner away"),
      ritualStatus: createRitualStatus(false, 3, {
        selfCompleted: false,
        partnerCompleted: true
      }),
      runtimeEntryMode: "hosted",
      showInviteCode: false,
      statusMessage: null,
      storedCatCount: 3,
      togetherDaysCount: 3,
      visitCompletedToday: false
    });

    expect(waitingState.partnerTitle).toBe("Waiting for partner");
    expect(waitingState.ritualTitle).toBe("Room-day visit open");
    expect(waitingState.roomModeLabel).toBe("Local room");
    expect(waitingState.togetherDaysLabel).toBe("Together Days 3");
    expect(waitingState.visitStatusLabel).toBe("Visited today");
    expect(waitingState.activeCatCountLabel).toBe("2 active cats");
    expect(waitingState.storedCatCountLabel).toBe("1 stored cat");
    expect(waitingState.catsNeedingCareLabel).toBe("1 cat needs care");
    expect(waitingState.deskActivityStatus).toBe("Ready now");
    expect(waitingState.cozyRestStatus).toBe("Lie down together");

    expect(togetherState.partnerTitle).toBe("Together now");
    expect(togetherState.ritualTitle).toBe("Room-day visit complete");
    expect(togetherState.roomModeLabel).toBe("Hosted couple room");
    expect(togetherState.deskActivityStatus).toBe("Paid today");
    expect(togetherState.catsNeedingCareLabel).toBe("All cats doing well");
    expect(togetherState.cozyRestStatus).toBe("Ready now");

    expect(reconnectingState.partnerTitle).toBe("Partner reconnecting");
    expect(reconnectingState.roomModeLabel).toBe("Local dev room");
    expect(reconnectingState.ritualTitle).toBe("Visit saved");

    expect(awayState.partnerTitle).toBe("Partner away");
    expect(awayState.ritualTitle).toBe("Partner visited");
  });

  it("keeps room details actions secondary and player-safe", () => {
    const detailsState = getPlayerRoomDetailsState({
      activityRows: [
        { label: "Snake", value: "Paid today" },
        { label: "Cozy Rest", value: "Ready now" }
      ],
      gridSnapEnabled: true,
      inviteCode: "ABCD12",
      memberCount: 1,
      roomId: "room-1",
      sharedRoomActive: true,
      togetherDaysCount: 6,
      visitCompletedToday: true
    });

    expect(detailsState.secondaryActions.map((action) => action.label)).toContain("Refresh room state");
    expect(detailsState.secondaryActions.map((action) => action.label)).toContain("Copy invite code");
    expect(detailsState.togetherDaysLabel).toBe("Together Days 6");
    expect(detailsState.visitStatusLabel).toBe("Visited today");
    expect(detailsState.activityRows).toEqual([
      { label: "Snake", value: "Paid today" },
      { label: "Cozy Rest", value: "Ready now" }
    ]);
  });

  it("marks build and inventory dock plaques active when their modes are open", () => {
    const dockState = getPlayerActionDockState({
      buildModeEnabled: true,
      catalogOpen: true,
      playerInteractionStatus: null
    });

    expect(dockState.actions.find((action) => action.id === "build")).toMatchObject({
      isActive: true,
      label: "Exit Build Mode"
    });
    expect(dockState.actions.find((action) => action.id === "inventory")).toMatchObject({
      isActive: true,
      label: "Close Inventory"
    });
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

  it("adds Cozy Rest to the player dock only when it is ready now", () => {
    const readyDock = getPlayerActionDockState({
      buildModeEnabled: false,
      catalogOpen: false,
      cozyRestReadyNow: true,
      playerInteractionStatus: null
    });
    const paidDock = getPlayerActionDockState({
      buildModeEnabled: false,
      catalogOpen: false,
      cozyRestPaidToday: true,
      playerInteractionStatus: null
    });

    expect(readyDock.actions.map((action) => action.label)).toContain("Cozy Rest");
    expect(readyDock.statusLabel).toBe("Cozy Rest ready now");
    expect(paidDock.actions.map((action) => action.label)).not.toContain("Cozy Rest");
    expect(paidDock.statusLabel).toBe("Cozy Rest paid today");
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
