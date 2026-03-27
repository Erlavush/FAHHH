import type { ReactNode } from "react";
import { getDeveloperQuickActions, getDeveloperSessionPanelState, getDeveloperWorkspaceTabState } from "../shellViewModel";
import { DeveloperSessionPanel } from "./DeveloperSessionPanel";
import { DeveloperWorkspaceHeader } from "./DeveloperWorkspaceHeader";
import { DeveloperWorkspaceRail } from "./DeveloperWorkspaceRail";
import { DeveloperWorkspaceShell } from "./DeveloperWorkspaceShell";
import { DevPanel } from "./DevPanel";
import { PerformanceMonitor } from "./PerformanceMonitor";

type DeveloperQuickActions = ReturnType<typeof getDeveloperQuickActions>;
type DeveloperSessionPanelState = ReturnType<typeof getDeveloperSessionPanelState>;
type DeveloperWorkspaceTabs = ReturnType<typeof getDeveloperWorkspaceTabState>;
type DevPanelProps = Parameters<typeof DevPanel>[0];

interface AppDeveloperViewProps {
  activeDeveloperTabLabel: string;
  debugOpen: boolean;
  developerQuickActions: DeveloperQuickActions;
  developerSessionPanelState: DeveloperSessionPanelState;
  developerStageNode: ReactNode;
  developerWorkspaceTabs: DeveloperWorkspaceTabs;
  devPanelProps: DevPanelProps;
  handleDeveloperQuickAction: (actionId: "refresh_room_state" | "reset_camera" | "reset_sandbox") => void;
  handleRefreshRoomState: () => void;
  isDev: boolean;
  modeSwitchNode: ReactNode;
  roomId: string | null;
  setDebugOpen: (updater: (current: boolean) => boolean) => void;
  handleSelectDeveloperWorkspaceTab: (nextTab: DeveloperWorkspaceTabs[number]["value"]) => void;
  sharedRoomActive: boolean;
  sharedRoomBlockingOverlayNode: ReactNode;
  sharedRoomModalNode: ReactNode;
  skinError: string | null;
}

export function AppDeveloperView({
  activeDeveloperTabLabel,
  debugOpen,
  developerQuickActions,
  developerSessionPanelState,
  developerStageNode,
  developerWorkspaceTabs,
  devPanelProps,
  handleDeveloperQuickAction,
  handleRefreshRoomState,
  isDev,
  modeSwitchNode,
  roomId,
  setDebugOpen,
  handleSelectDeveloperWorkspaceTab,
  sharedRoomActive,
  sharedRoomBlockingOverlayNode,
  sharedRoomModalNode,
  skinError
}: AppDeveloperViewProps) {
  return (
    <DeveloperWorkspaceShell
      header={
        <DeveloperWorkspaceHeader
          activeTabLabel={activeDeveloperTabLabel}
          inspectorVisible={debugOpen}
          modeSwitch={isDev ? modeSwitchNode : null}
          onQuickAction={handleDeveloperQuickAction}
          onToggleInspector={() => setDebugOpen((current) => !current)}
          quickActions={developerQuickActions}
          roomId={roomId}
        />
      }
      inspector={<DevPanel {...devPanelProps} />}
      overlays={
        <>
          {sharedRoomActive ? sharedRoomBlockingOverlayNode : null}
          {sharedRoomModalNode}
        </>
      }
      rail={
        <DeveloperWorkspaceRail
          onSelectTab={handleSelectDeveloperWorkspaceTab}
          tabs={developerWorkspaceTabs}
        />
      }
      stage={developerStageNode}
      utility={
        <div className="developer-workspace-shell__utility-stack">
          <DeveloperSessionPanel
            onRefreshRoomState={sharedRoomActive ? handleRefreshRoomState : null}
            state={developerSessionPanelState}
          />
          <PerformanceMonitor />
          {skinError ? <div className="scene-note scene-note--inline">{skinError}</div> : null}
        </div>
      }
    />
  );
}