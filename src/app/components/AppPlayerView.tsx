import type { ReactNode } from "react";
import { PcMinigameOverlay } from "../../components/PcMinigameOverlay";
import {
  MinecraftClock,
  PlayerActionDock,
  PlayerCompanionCard,
  PlayerRoomDetailsSheet
} from "../../components/ui";
import { getPlayerActionDockState, getPlayerCompanionCardState, getPlayerRoomDetailsState } from "../shellViewModel";
import { BreakupResetDialog } from "./BreakupResetDialog";
import { PlayerRoomShell } from "./PlayerRoomShell";
import type { PcDeskActivityId, PcMinigameResult } from "../../lib/pcMinigame";

type PlayerActionDockState = ReturnType<typeof getPlayerActionDockState>;
type PlayerCompanionCardState = ReturnType<typeof getPlayerCompanionCardState>;
type PlayerRoomDetailsState = ReturnType<typeof getPlayerRoomDetailsState>;
type PcOverlayProgress = Parameters<typeof PcMinigameOverlay>[0]["progress"];

interface AppPlayerViewProps {
  ampm: "AM" | "PM";
  breakupResetDialogOpen: boolean;
  breakupResetSaving: boolean;
  catalogOpen: boolean;
  currentThemeId: string;
  displayedPcMinigameProgress: PcOverlayProgress;
  displayedPlayerCoins: number;
  handleBreakupResetConfirm: () => void;
  handleExitPcMinigame: () => void;
  handleOpenPetCare: () => void;
  handlePcMinigameComplete: (result: PcMinigameResult) => void;
  handlePlayerDockAction: (actionId: "build" | "inventory" | "interaction" | "cozy_rest") => void;
  handlePlayerRoomDetailsAction: (
    actionId: "copy_invite" | "refresh_room_state" | "toggle_grid_snap" | "import_skin" | "breakup_reset" | "reset_sandbox"
  ) => void;
  handleSetTheme: (themeId: string) => void;
  hostedEntryFlowActive: boolean;
  inventoryPanelNode: ReactNode;
  modeSwitchNode: ReactNode;
  musicPlayerNode: ReactNode;
  pcMinigameActive: boolean;
  playerActionDockState: PlayerActionDockState;
  playerCompanionCardExpanded: boolean;
  playerDockMetricLabel?: string;
  playerCompanionCardState: PlayerCompanionCardState;
  playerLevel: number;
  showPlayerCompanionCard: boolean;
  playerRoomDetailsOpen: boolean;
  playerRoomDetailsState: PlayerRoomDetailsState;
  roomStageNode: ReactNode;
  setBreakupResetDialogOpen: (open: boolean) => void;
  setPlayerCompanionCardExpanded: (updater: (current: boolean) => boolean) => void;
  setPlayerRoomDetailsOpen: (open: boolean) => void;
  sharedPcPaidTodayByActivityId?: Partial<Record<PcDeskActivityId, boolean>>;
  sharedPcResult: {
    dailyRitualStatus: string;
    dailyRitualBonusCoins: number;
    dailyRitualBonusXp: number;
    streakCount: number;
  } | null;
  sharedRoomBlockingOverlayNode: ReactNode;
  sharedRoomEntryOverlayNode: ReactNode;
  sharedRoomModalNode: ReactNode;
  togetherDaysCount: number;
  unlockedThemeIds: Set<string>;
  worldTimeLabel12h: string;
}

export function AppPlayerView({
  ampm,
  breakupResetDialogOpen,
  breakupResetSaving,
  catalogOpen,
  currentThemeId,
  displayedPcMinigameProgress,
  displayedPlayerCoins,
  handleBreakupResetConfirm,
  handleExitPcMinigame,
  handleOpenPetCare,
  handlePcMinigameComplete,
  handlePlayerDockAction,
  handlePlayerRoomDetailsAction,
  handleSetTheme,
  hostedEntryFlowActive,
  inventoryPanelNode,
  modeSwitchNode,
  musicPlayerNode,
  pcMinigameActive,
  playerActionDockState,
  playerCompanionCardExpanded,
  playerDockMetricLabel,
  playerCompanionCardState,
  playerLevel,
  showPlayerCompanionCard,
  playerRoomDetailsOpen,
  playerRoomDetailsState,
  roomStageNode,
  setBreakupResetDialogOpen,
  setPlayerCompanionCardExpanded,
  setPlayerRoomDetailsOpen,
  sharedPcPaidTodayByActivityId,
  sharedPcResult,
  sharedRoomBlockingOverlayNode,
  sharedRoomEntryOverlayNode,
  sharedRoomModalNode,
  togetherDaysCount,
  unlockedThemeIds,
  worldTimeLabel12h
}: AppPlayerViewProps) {
  return (
    <PlayerRoomShell
      bottomCenter={
        hostedEntryFlowActive ? null : (
          <PlayerActionDock
            actions={playerActionDockState.actions}
            onAction={handlePlayerDockAction}
            statusLabel={playerActionDockState.statusLabel}
            coins={displayedPlayerCoins}
            level={playerLevel}
            metricLabel={playerDockMetricLabel}
            togetherDays={togetherDaysCount}
          />
        )
      }
      bottomLeft={null}
      bottomRight={hostedEntryFlowActive ? null : musicPlayerNode}
      drawer={hostedEntryFlowActive ? null : catalogOpen ? inventoryPanelNode : null}
      overlays={
        <>
          {sharedRoomBlockingOverlayNode}
          {sharedRoomEntryOverlayNode}
          {!hostedEntryFlowActive ? (
            <PlayerRoomDetailsSheet
              currentThemeId={currentThemeId}
              onAction={handlePlayerRoomDetailsAction}
              onClose={() => setPlayerRoomDetailsOpen(false)}
              onSetTheme={handleSetTheme}
              open={playerRoomDetailsOpen}
              state={{
                ...playerRoomDetailsState,
                togetherDaysLabel: playerCompanionCardState.togetherDaysLabel
              }}
              unlockedThemeIds={unlockedThemeIds}
            />
          ) : null}
          {!hostedEntryFlowActive ? (
            <BreakupResetDialog
              onClose={() => setBreakupResetDialogOpen(false)}
              onConfirm={handleBreakupResetConfirm}
              open={breakupResetDialogOpen}
              saving={breakupResetSaving}
            />
          ) : null}
          {!hostedEntryFlowActive && pcMinigameActive ? (
            <PcMinigameOverlay
              currentCoins={displayedPlayerCoins}
              dailyRitualBonusCoins={sharedPcResult?.dailyRitualBonusCoins ?? 0}
              dailyRitualBonusXp={sharedPcResult?.dailyRitualBonusXp ?? 0}
              dailyRitualStatus={sharedPcResult?.dailyRitualStatus ?? null}
              onComplete={handlePcMinigameComplete}
              onExit={handleExitPcMinigame}
              paidTodayByActivityId={sharedPcPaidTodayByActivityId}
              progress={displayedPcMinigameProgress}
              streakCount={sharedPcResult?.streakCount ?? togetherDaysCount}
            />
          ) : null}
          {sharedRoomModalNode}
        </>
      }
      stage={roomStageNode}
      topCenter={<MinecraftClock label={worldTimeLabel12h} ampm={ampm} />}
      topLeft={modeSwitchNode}
      topRight={
        hostedEntryFlowActive || !showPlayerCompanionCard ? null : (
          <div className="player-room-shell__top-right-stack">
            <PlayerCompanionCard
              expanded={playerCompanionCardExpanded}
              onOpenDetails={() => setPlayerRoomDetailsOpen(true)}
              onOpenPetCare={
                playerCompanionCardState.petCareActionLabel ? handleOpenPetCare : undefined
              }
              onToggleExpanded={() =>
                setPlayerCompanionCardExpanded((current) => !current)
              }
              state={playerCompanionCardState}
            />
          </div>
        )
      }
    />
  );
}

