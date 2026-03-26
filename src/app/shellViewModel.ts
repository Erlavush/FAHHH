import type { SharedPresenceStatus } from "./hooks/useSharedRoomPresence";
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
  id: "build" | "inventory" | "interaction";
  label: string;
  tone: "primary" | "secondary" | "ghost";
};

export type PlayerCompanionCardState = {
  inviteCode: string;
  partnerBody: string;
  partnerTitle: "Waiting for partner" | "Together now" | "Reconnecting";
  ritualBody: string;
  ritualTitle: "Daily ritual pending" | "Daily ritual complete";
  roomSyncStatus: string | null;
  showInviteCode: boolean;
  streakLabel: string;
  tone: "presence" | "success" | "attention";
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
  dangerAction: PlayerRoomDetailsAction | null;
  inviteCode: string;
  inviteCodeVisible: boolean;
  roomId: string | null;
  secondaryActions: PlayerRoomDetailsAction[];
  subtitle: string;
  title: string;
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
      partnerTitle: "Reconnecting",
      partnerBody: "Hold tight while the room catches up to your partner's latest presence.",
      tone: "attention"
    };
  }

  return {
    partnerTitle: "Together now",
    partnerBody: "Both partners are in the room and the latest shared state is loaded.",
    tone: "success"
  };
}

function mapRitualStatus(ritualStatus: SharedRitualStatusView): Pick<PlayerCompanionCardState, "ritualBody" | "ritualTitle"> {
  if (ritualStatus.ritualComplete) {
    return {
      ritualTitle: "Daily ritual complete",
      ritualBody: "Today's shared check-in is done. Come back tomorrow to protect the streak."
    };
  }

  return {
    ritualTitle: "Daily ritual pending",
    ritualBody: "Both partners still need one desk check-in today."
  };
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
  inviteCode,
  memberCount,
  presenceStatus,
  ritualStatus,
  showInviteCode,
  statusMessage
}: {
  inviteCode: string;
  memberCount: number;
  presenceStatus: SharedPresenceStatus | null;
  ritualStatus: SharedRitualStatusView;
  showInviteCode: boolean;
  statusMessage: string | null;
}): PlayerCompanionCardState {
  return {
    inviteCode,
    roomSyncStatus: statusMessage,
    showInviteCode,
    streakLabel: `Streak ${ritualStatus.streakCount}`,
    ...mapPresenceStatus(presenceStatus, memberCount),
    ...mapRitualStatus(ritualStatus)
  };
}

export function getPlayerActionDockState({
  buildModeEnabled,
  catalogOpen,
  playerInteractionStatus
}: {
  buildModeEnabled: boolean;
  catalogOpen: boolean;
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

  if (interactionAction) {
    actions.push(interactionAction);
  }

  return {
    actions,
    statusLabel: buildModeEnabled
      ? catalogOpen
        ? "Build mode active • inventory open"
        : "Build mode active"
      : "Room mode"
  };
}

export function getPlayerRoomDetailsState({
  gridSnapEnabled,
  inviteCode,
  memberCount,
  roomId,
  sharedRoomActive
}: {
  gridSnapEnabled: boolean;
  inviteCode: string;
  memberCount: number;
  roomId: string | null;
  sharedRoomActive: boolean;
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
    title: "Room details",
    subtitle: sharedRoomActive
      ? "Secondary room actions, invite sharing, build settings, and room safety."
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
    secondaryActions
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
    syncStatus: statusMessage,
  };
}

export function getPreviewStudioTab(
  mode: PreviewStudioMode
): DeveloperWorkspaceTab {
  return mode === "mob_lab" ? "mob_lab" : "preview_studio";
}
