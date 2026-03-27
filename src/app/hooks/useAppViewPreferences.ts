import { useEffect, useMemo, useState } from "react";
import type { FurnitureType } from "../../lib/furnitureRegistry";
import {
  loadPersistedWorldSettings,
  savePersistedWorldSettings
} from "../../lib/devWorldSettings";
import {
  getDefaultShellViewMode
} from "../shellViewModel";
import type {
  AppShellViewMode,
  DeveloperWorkspaceTab,
  PreviewStudioMode
} from "../types";

export function useAppViewPreferences(isDev: boolean) {
  const initialWorldSettings = useMemo(() => loadPersistedWorldSettings(), []);
  const [shellViewMode, setShellViewMode] = useState<AppShellViewMode>(() =>
    getDefaultShellViewMode(isDev, initialWorldSettings.shellViewMode)
  );
  const [developerWorkspaceTab, setDeveloperWorkspaceTab] = useState<DeveloperWorkspaceTab>(
    initialWorldSettings.developerWorkspaceTab ?? "room"
  );
  const [playerCompanionCardExpanded, setPlayerCompanionCardExpanded] = useState(
    initialWorldSettings.playerCompanionCardExpanded ?? false
  );
  const [playerRoomDetailsOpen, setPlayerRoomDetailsOpen] = useState(false);
  const [buildModeEnabled, setBuildModeEnabled] = useState(
    initialWorldSettings.buildModeEnabled ?? false
  );
  const [catalogOpen, setCatalogOpen] = useState(initialWorldSettings.catalogOpen ?? false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(
    initialWorldSettings.gridSnapEnabled ?? true
  );
  const [debugOpen, setDebugOpen] = useState(initialWorldSettings.debugOpen ?? true);
  const [previewStudioOpen, setPreviewStudioOpen] = useState(
    initialWorldSettings.previewStudioOpen ?? false
  );
  const [previewStudioMode, setPreviewStudioMode] = useState<PreviewStudioMode>(
    initialWorldSettings.previewStudioMode ?? "furniture"
  );
  const [previewStudioSelectedType, setPreviewStudioSelectedType] = useState<FurnitureType>(
    initialWorldSettings.previewStudioSelectedType ?? "bed"
  );
  const [previewStudioSelectedMobId, setPreviewStudioSelectedMobId] = useState(
    initialWorldSettings.previewStudioSelectedMobId ?? "better_cats_v4_tabby"
  );
  const [devPanelBuildSettingsCollapsed, setDevPanelBuildSettingsCollapsed] = useState(
    initialWorldSettings.devPanelBuildSettingsCollapsed ?? false
  );
  const [devPanelPlayerStateCollapsed, setDevPanelPlayerStateCollapsed] = useState(
    initialWorldSettings.devPanelPlayerStateCollapsed ?? false
  );
  const [devPanelPlayerCoordinatesCollapsed, setDevPanelPlayerCoordinatesCollapsed] = useState(
    initialWorldSettings.devPanelPlayerCoordinatesCollapsed ?? false
  );
  const [devPanelCameraPropertiesCollapsed, setDevPanelCameraPropertiesCollapsed] = useState(
    initialWorldSettings.devPanelCameraPropertiesCollapsed ?? false
  );
  const [devPanelWorldSettingsCollapsed, setDevPanelWorldSettingsCollapsed] = useState(
    initialWorldSettings.devPanelWorldSettingsCollapsed ?? false
  );
  const [devPanelLightingFxCollapsed, setDevPanelLightingFxCollapsed] = useState(
    initialWorldSettings.devPanelLightingFxCollapsed ?? false
  );
  const [devPanelCollisionDebugCollapsed, setDevPanelCollisionDebugCollapsed] = useState(
    initialWorldSettings.devPanelCollisionDebugCollapsed ?? false
  );
  const [devPanelActionsCollapsed, setDevPanelActionsCollapsed] = useState(
    initialWorldSettings.devPanelActionsCollapsed ?? false
  );
  const [showCollisionDebug, setShowCollisionDebug] = useState(
    initialWorldSettings.showCollisionDebug ?? false
  );
  const [showPlayerCollider, setShowPlayerCollider] = useState(
    initialWorldSettings.showPlayerCollider ?? true
  );
  const [showInteractionMarkers, setShowInteractionMarkers] = useState(
    initialWorldSettings.showInteractionMarkers ?? true
  );

  useEffect(() => {
    savePersistedWorldSettings({
      shellViewMode: isDev ? shellViewMode : "player",
      developerWorkspaceTab,
      playerCompanionCardExpanded,
      buildModeEnabled,
      catalogOpen,
      gridSnapEnabled,
      debugOpen,
      previewStudioOpen,
      previewStudioMode,
      previewStudioSelectedType,
      previewStudioSelectedMobId,
      devPanelBuildSettingsCollapsed,
      devPanelPlayerStateCollapsed,
      devPanelPlayerCoordinatesCollapsed,
      devPanelCameraPropertiesCollapsed,
      devPanelWorldSettingsCollapsed,
      devPanelLightingFxCollapsed,
      devPanelCollisionDebugCollapsed,
      devPanelActionsCollapsed,
      showCollisionDebug,
      showPlayerCollider,
      showInteractionMarkers
    });
  }, [
    buildModeEnabled,
    catalogOpen,
    debugOpen,
    devPanelActionsCollapsed,
    devPanelBuildSettingsCollapsed,
    devPanelCameraPropertiesCollapsed,
    devPanelCollisionDebugCollapsed,
    devPanelLightingFxCollapsed,
    devPanelPlayerCoordinatesCollapsed,
    devPanelPlayerStateCollapsed,
    devPanelWorldSettingsCollapsed,
    developerWorkspaceTab,
    gridSnapEnabled,
    isDev,
    playerCompanionCardExpanded,
    previewStudioMode,
    previewStudioOpen,
    previewStudioSelectedMobId,
    previewStudioSelectedType,
    shellViewMode,
    showCollisionDebug,
    showInteractionMarkers,
    showPlayerCollider
  ]);

  return {
    buildModeEnabled,
    catalogOpen,
    debugOpen,
    devPanelActionsCollapsed,
    devPanelBuildSettingsCollapsed,
    devPanelCameraPropertiesCollapsed,
    devPanelCollisionDebugCollapsed,
    devPanelLightingFxCollapsed,
    devPanelPlayerCoordinatesCollapsed,
    devPanelPlayerStateCollapsed,
    devPanelWorldSettingsCollapsed,
    developerWorkspaceTab,
    gridSnapEnabled,
    playerCompanionCardExpanded,
    playerRoomDetailsOpen,
    previewStudioMode,
    previewStudioOpen,
    previewStudioSelectedMobId,
    previewStudioSelectedType,
    setBuildModeEnabled,
    setCatalogOpen,
    setDebugOpen,
    setDevPanelActionsCollapsed,
    setDevPanelBuildSettingsCollapsed,
    setDevPanelCameraPropertiesCollapsed,
    setDevPanelCollisionDebugCollapsed,
    setDevPanelLightingFxCollapsed,
    setDevPanelPlayerCoordinatesCollapsed,
    setDevPanelPlayerStateCollapsed,
    setDevPanelWorldSettingsCollapsed,
    setDeveloperWorkspaceTab,
    setGridSnapEnabled,
    setPlayerCompanionCardExpanded,
    setPlayerRoomDetailsOpen,
    setPreviewStudioMode,
    setPreviewStudioOpen,
    setPreviewStudioSelectedMobId,
    setPreviewStudioSelectedType,
    setShellViewMode,
    setShowCollisionDebug,
    setShowInteractionMarkers,
    setShowPlayerCollider,
    shellViewMode,
    showCollisionDebug,
    showInteractionMarkers,
    showPlayerCollider
  };
}