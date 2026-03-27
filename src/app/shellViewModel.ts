import type { SharedPresenceStatus } from "./hooks/useSharedRoomPresence";
import type { SharedRoomRuntimeEntryMode } from "./hooks/useSharedRoomRuntime";
import type {
  AppShellViewMode,
  DeveloperWorkspaceTab,
  PlayerInteractionStatus,
  PreviewStudioMode
} from "./types";
import type { SharedRitualStatusView } from "../lib/sharedProgression";

export type DeveloperWorkspaceTabDefinition = {
  description: string;
  label: string;
  value: DeveloperWorkspaceTab;
};

export type PlayerActionDockAction = {
  id: "build" | "inventory" | "interaction" | "cozy_rest";
  label: string;
  tone: "primary" | "secondary" | "ghost";
};

export type PlayerCompanionCardState = {
  cozyRestStatus: string;
  deskActivityStatus: string;
  inviteCode: string;
  partnerBody: string;
  partnerTitle:
    | "Waiting for partner"
    | "Together now"
    | "Partner reconnecting"
    | "Partner away";
  ritualBody: string;
  ritualTitle: "Room-day visit open" | "Room-day visit complete" | "Visit saved" | "Partner visited";
  roomModeLabel: string | null;
  roomSyncStatus: string | null;
  showInviteCode: boolean;
  togetherDaysLabel: string;
  tone: "presence" | "success" | "attention";
  visitStatusLabel: string;
};

export type PlayerRoomDetailsAction = {
  id:
    | "copy_invite"
    | "refresh_room_state"
    | "toggle_grid_snap"
    | "import_skin"
    | "breakup_reset";
  label: string;
};

export type PlayerRoomDetailsState = {
  activityRows: { label: string; value: string }[];
  dangerAction: PlayerRoomDetailsAction | null;
  inviteCode: string;
  inviteCodeVisible: boolean;
  roomId: string | null;
  secondaryActions: PlayerRoomDetailsAction[];
  subtitle: string;
  title: string;
  togetherDaysLabel: string;
  visitStatusLabel: string;
};

export type DeveloperWorkspaceTabState = DeveloperWorkspaceTabDefinition & {
  isActive: boolean;
};

export type DeveloperQuickAction = {
  id: "refresh_room_state" | "reset_camera" | "reset_sandbox";
  label: string;
};

export type DeveloperSessionPanelState = {
  inviteCode: string | null;
  memberCountLabel: string;
  presenceBody: string;
  presenceTitle: string;
  roomId: string | null;
  syncStatus: string | null;
};

const DEVELOPER_WORKSPACE_TABS: readonly DeveloperWorkspaceTabDefinition[] = [
  {
    value: "room",
    label: "Room",
    description: "Live room runtime with the current player and room state."
  },
  {
    value: "inventory",
    label: "Inventory",
    description: "Shared inventory, pet catalog, and placement flow tooling."
  },
  {
    value: "preview_studio",
    label: "Preview Studio",
    description: "Furniture preview capture and shop thumbnail authoring."
  },
  {
    value: "mob_lab",
    label: "Mob Lab",
    description: "Imported mob rig, animation, and collider authoring."
  },
  {
    value: "world",
    label: "World",
    description: "Clock, lighting, camera, and world debug controls."
  },
  {
    value: "session",
    label: "Session",
    description: "Shared-room diagnostics, invite codes, and sync actions."
  }
] as const;

function mapPresenceStatus(
  presenceStatus: SharedPresenceStatus | null,
  memberCount: number
): Pick<PlayerCompanionCardState, "partnerBody" | "partnerTitle" | "tone"> {
  if (!presenceStatus || memberCount < 2) {
    return {
      partnerTitle: "Waiting for partner",
      partnerBody: "Send the invite code from Room details when you are ready to decorate together.",
      tone: "presence"
    };
  }

  if (presenceStatus.title === "Partner reconnecting") {
    return {
      partnerTitle: "Partner reconnecting",
      partnerBody: "Hold tight while the room catches up to your partner's latest presence.",
      tone: "attention"
    };
  }

  if (presenceStatus.title === "Partner away") {
    return {
      partnerTitle: "Partner away",
      partnerBody: "Your partner is offline right now, but the room is still ready for you.",
      tone: "presence"
    };
  }

  return {
    partnerTitle: "Together now",
    partnerBody: "Both partners are in the room and the latest shared state is loaded.",
    tone: "success"
  };
}

function getRoomModeLabel(runtimeEntryMode: SharedRoomRuntimeEntryMode): string | null {
  switch (runtimeEntryMode) {
    case "hosted":
      return "Hosted couple room";
    case "dev_fallback":
      return "Local dev room";
    case "hosted_unavailable":
      return "Hosted setup required";
    case "legacy":
    default:
      return "Local room";
  }
}

function mapRitualStatus(
  ritualStatus: SharedRitualStatusView
): Pick<PlayerCompanionCardState, "ritualBody" | "ritualTitle"> {
  if (ritualStatus.ritualComplete) {
    return {
      ritualTitle: "Room-day visit complete",
      ritualBody: "Both visits landed today. Your next Together Day can wait until tomorrow."
    };
  }

  if (ritualStatus.selfCompleted && !ritualStatus.partnerCompleted) {
    return {
      ritualTitle: "Visit saved",
      ritualBody: "You visited today. It counts once your partner drops by too."
    };
  }

  if (!ritualStatus.selfCompleted && ritualStatus.partnerCompleted) {
    return {
      ritualTitle: "Partner visited",
      ritualBody: "Your partner stopped by today. Visit when you can to count this room-day."
    };
  }

  return {
    ritualTitle: "Room-day visit open",
    ritualBody: "Both visits within the same room-day add one Together Day."
  };
}

function getVisitStatusLabel(visitCompletedToday: boolean): string {
  return visitCompletedToday ? "Visited today" : "Visit the room today";
}

function getDeskActivityStatus(
  deskActivityReadyNow: boolean,
  deskActivityPaidToday: boolean
): string {
  if (deskActivityPaidToday && !deskActivityReadyNow) {
    return "Paid today";
  }

  return "Ready now";
}

function getCozyRestStatus(
  cozyRestReadyNow: boolean,
  cozyRestPaidToday: boolean
): string {
  if (cozyRestPaidToday && !cozyRestReadyNow) {
    return "Paid today";
  }

  if (cozyRestReadyNow) {
    return "Ready now";
  }

  return "Lie down together";
}

function getInteractionAction(
  playerInteractionStatus: PlayerInteractionStatus
): PlayerActionDockAction | null {
  if (!playerInteractionStatus) {
    return null;
  }

  return {
    id: "interaction",
    label:
      playerInteractionStatus.phase === "active"
        ? `Stand Up (${playerInteractionStatus.label})`
        : `Cancel ${playerInteractionStatus.label}`,
    tone: "ghost"
  };
}

export function getDefaultShellViewMode(
  isDev: boolean,
  persistedMode?: AppShellViewMode
): AppShellViewMode {
  if (!isDev) {
    return "player";
  }

  return persistedMode ?? "developer";
}

export function getDeveloperWorkspaceTabs(): readonly DeveloperWorkspaceTabDefinition[] {
  return DEVELOPER_WORKSPACE_TABS;
}

export function isDeveloperSurfaceVisible(
  shellViewMode: AppShellViewMode,
  isDev: boolean
): boolean {
  return isDev && shellViewMode === "developer";
}

export function getDeveloperWorkspaceTabState(
  activeTab: DeveloperWorkspaceTab
): DeveloperWorkspaceTabState[] {
  return DEVELOPER_WORKSPACE_TABS.map((tab) => ({
    ...tab,
    isActive: tab.value === activeTab
  }));
}

export function getPlayerCompanionCardState({
  cozyRestPaidToday,
  cozyRestReadyNow,
  deskActivityPaidToday,
  deskActivityReadyNow,
  inviteCode,
  memberCount,
  presenceStatus,
  ritualStatus,
  runtimeEntryMode,
  showInviteCode,
  statusMessage,
  togetherDaysCount,
  visitCompletedToday
}: {
  cozyRestPaidToday: boolean;
  cozyRestReadyNow: boolean;
  deskActivityPaidToday: boolean;
  deskActivityReadyNow: boolean;
  inviteCode: string;
  memberCount: number;
  presenceStatus: SharedPresenceStatus | null;
  ritualStatus: SharedRitualStatusView;
  runtimeEntryMode: SharedRoomRuntimeEntryMode;
  showInviteCode: boolean;
  statusMessage: string | null;
  togetherDaysCount: number;
  visitCompletedToday: boolean;
}): PlayerCompanionCardState {
  return {
    inviteCode,
    roomModeLabel: getRoomModeLabel(runtimeEntryMode),
    roomSyncStatus: statusMessage,
    showInviteCode,
    togetherDaysLabel: `Together Days ${togetherDaysCount}`,
    visitStatusLabel: getVisitStatusLabel(visitCompletedToday),
    deskActivityStatus: getDeskActivityStatus(deskActivityReadyNow, deskActivityPaidToday),
    cozyRestStatus: getCozyRestStatus(cozyRestReadyNow, cozyRestPaidToday),
    ...mapPresenceStatus(presenceStatus, memberCount),
    ...mapRitualStatus(ritualStatus)
  };
}

export function getPlayerActionDockState({
  buildModeEnabled,
  catalogOpen,
  cozyRestPaidToday = false,
  cozyRestReadyNow = false,
  playerInteractionStatus
}: {
  buildModeEnabled: boolean;
  catalogOpen: boolean;
  cozyRestPaidToday?: boolean;
  cozyRestReadyNow?: boolean;
  playerInteractionStatus: PlayerInteractionStatus;
}): {
  actions: PlayerActionDockAction[];
  statusLabel: string;
} {
  const actions: PlayerActionDockAction[] = [
    {
      id: "build",
      label: buildModeEnabled ? "Exit Build Mode" : "Enter Build Mode",
      tone: "primary"
    },
    {
      id: "inventory",
      label: catalogOpen ? "Close Inventory" : "Open Inventory",
      tone: "secondary"
    }
  ];
  const interactionAction = getInteractionAction(playerInteractionStatus);

  if (cozyRestReadyNow) {
    actions.push({
      id: "cozy_rest",
      label: "Cozy Rest",
      tone: "secondary"
    });
  }

  if (interactionAction) {
    actions.push(interactionAction);
  }

  let statusLabel = buildModeEnabled
    ? catalogOpen
      ? "Build mode active / inventory open"
      : "Build mode active"
    : "Room mode";

  if (cozyRestReadyNow) {
    statusLabel = "Cozy Rest ready now";
  } else if (cozyRestPaidToday) {
    statusLabel = "Cozy Rest paid today";
  }

  return {
    actions,
    statusLabel
  };
}

export function getPlayerRoomDetailsState({
  activityRows,
  gridSnapEnabled,
  inviteCode,
  memberCount,
  roomId,
  sharedRoomActive,
  togetherDaysCount,
  visitCompletedToday
}: {
  activityRows: { label: string; value: string }[];
  gridSnapEnabled: boolean;
  inviteCode: string;
  memberCount: number;
  roomId: string | null;
  sharedRoomActive: boolean;
  togetherDaysCount: number;
  visitCompletedToday: boolean;
}): PlayerRoomDetailsState {
  const secondaryActions: PlayerRoomDetailsAction[] = [
    {
      id: "toggle_grid_snap",
      label: gridSnapEnabled ? "Grid snap: On" : "Grid snap: Off"
    },
    {
      id: "import_skin",
      label: "Import Minecraft Skin"
    }
  ];

  if (memberCount < 2 && inviteCode) {
    secondaryActions.unshift({
      id: "copy_invite",
      label: "Copy invite code"
    });
  }

  if (sharedRoomActive) {
    secondaryActions.push({
      id: "refresh_room_state",
      label: "Refresh room state"
    });
  }

  return {
    activityRows,
    title: "Room details",
    subtitle: sharedRoomActive
      ? "Canonical room actions, visit state, and today's activity payouts."
      : "Build settings and local room profile actions.",
    dangerAction: sharedRoomActive
      ? {
          id: "breakup_reset",
          label: "Break up and reset room"
        }
      : null,
    inviteCode,
    inviteCodeVisible: memberCount < 2 && inviteCode.length > 0,
    roomId,
    secondaryActions,
    togetherDaysLabel: `Together Days ${togetherDaysCount}`,
    visitStatusLabel: getVisitStatusLabel(visitCompletedToday)
  };
}

export function getDeveloperQuickActions(
  sharedRoomActive: boolean
): DeveloperQuickAction[] {
  return [
    ...(sharedRoomActive
      ? [
          {
            id: "refresh_room_state" as const,
            label: "Refresh room state"
          }
        ]
      : []),
    {
      id: "reset_camera",
      label: "Reset camera"
    },
    {
      id: "reset_sandbox",
      label: "Reset sandbox"
    }
  ];
}

export function getDeveloperSessionPanelState({
  inviteCode,
  memberCount,
  presenceStatus,
  roomId,
  statusMessage
}: {
  inviteCode: string | null;
  memberCount: number;
  presenceStatus: SharedPresenceStatus | null;
  roomId: string | null;
  statusMessage: string | null;
}): DeveloperSessionPanelState {
  return {
    roomId,
    inviteCode,
    memberCountLabel: `${memberCount} member${memberCount === 1 ? "" : "s"}`,
    presenceTitle: presenceStatus?.title ?? "Waiting for partner",
    presenceBody:
      presenceStatus?.body ?? "The room stays usable while your partner is away.",
    syncStatus: statusMessage
  };
}

export function getPreviewStudioTab(
  mode: PreviewStudioMode
): DeveloperWorkspaceTab {
  return mode === "mob_lab" ? "mob_lab" : "preview_studio";
}
