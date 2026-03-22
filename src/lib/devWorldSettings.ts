import type { PreviewStudioMode } from "../app/types";
import {
  FURNITURE_REGISTRY,
  type FurnitureType
} from "./furnitureRegistry";

export const WORLD_SETTINGS_KEY = "cozy-room-dev-world-settings-v1";
export const LEGACY_LEVA_SETTINGS_KEY = "cozy-room-leva-settings";

export interface PersistedWorldSettings {
  version: 1;
  minecraftTimeMinutes?: number;
  useMinecraftTimeToggle?: boolean;
  timeLocked?: boolean;
  lockedTimeMinutes?: number;
  sunEnabled?: boolean;
  shadowsEnabled?: boolean;
  fogEnabled?: boolean;
  fogDensity?: number;
  ambientMultiplier?: number;
  sunIntensityMultiplier?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;
  buildModeEnabled?: boolean;
  catalogOpen?: boolean;
  gridSnapEnabled?: boolean;
  debugOpen?: boolean;
  previewStudioOpen?: boolean;
  previewStudioMode?: PreviewStudioMode;
  previewStudioSelectedType?: FurnitureType;
  previewStudioSelectedMobId?: string;
  devPanelBuildSettingsCollapsed?: boolean;
  devPanelPlayerStateCollapsed?: boolean;
  devPanelPlayerCoordinatesCollapsed?: boolean;
  devPanelCameraPropertiesCollapsed?: boolean;
  devPanelWorldSettingsCollapsed?: boolean;
  devPanelLightingFxCollapsed?: boolean;
  devPanelCollisionDebugCollapsed?: boolean;
  devPanelActionsCollapsed?: boolean;
  showCollisionDebug?: boolean;
  showPlayerCollider?: boolean;
  showInteractionMarkers?: boolean;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function sanitizeNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function sanitizePreviewStudioMode(value: unknown): PreviewStudioMode | undefined {
  return value === "furniture" || value === "mob_lab" ? value : undefined;
}

function sanitizeFurnitureType(value: unknown): FurnitureType | undefined {
  return typeof value === "string" && value in FURNITURE_REGISTRY
    ? (value as FurnitureType)
    : undefined;
}

function sanitizeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeWorldSettings(value: unknown): PersistedWorldSettings {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    version: 1,
    minecraftTimeMinutes: sanitizeNumber(source.minecraftTimeMinutes),
    useMinecraftTimeToggle: sanitizeBoolean(source.useMinecraftTimeToggle),
    timeLocked: sanitizeBoolean(source.timeLocked),
    lockedTimeMinutes: sanitizeNumber(source.lockedTimeMinutes),
    sunEnabled: sanitizeBoolean(source.sunEnabled),
    shadowsEnabled: sanitizeBoolean(source.shadowsEnabled),
    fogEnabled: sanitizeBoolean(source.fogEnabled),
    fogDensity: sanitizeNumber(source.fogDensity),
    ambientMultiplier: sanitizeNumber(source.ambientMultiplier),
    sunIntensityMultiplier: sanitizeNumber(source.sunIntensityMultiplier),
    brightness: sanitizeNumber(source.brightness),
    saturation: sanitizeNumber(source.saturation),
    contrast: sanitizeNumber(source.contrast),
    buildModeEnabled: sanitizeBoolean(source.buildModeEnabled),
    catalogOpen: sanitizeBoolean(source.catalogOpen),
    gridSnapEnabled: sanitizeBoolean(source.gridSnapEnabled),
    debugOpen: sanitizeBoolean(source.debugOpen),
    previewStudioOpen: sanitizeBoolean(source.previewStudioOpen),
    previewStudioMode: sanitizePreviewStudioMode(source.previewStudioMode),
    previewStudioSelectedType: sanitizeFurnitureType(source.previewStudioSelectedType),
    previewStudioSelectedMobId: sanitizeString(source.previewStudioSelectedMobId),
    devPanelBuildSettingsCollapsed: sanitizeBoolean(source.devPanelBuildSettingsCollapsed),
    devPanelPlayerStateCollapsed: sanitizeBoolean(source.devPanelPlayerStateCollapsed),
    devPanelPlayerCoordinatesCollapsed: sanitizeBoolean(source.devPanelPlayerCoordinatesCollapsed),
    devPanelCameraPropertiesCollapsed: sanitizeBoolean(source.devPanelCameraPropertiesCollapsed),
    devPanelWorldSettingsCollapsed: sanitizeBoolean(source.devPanelWorldSettingsCollapsed),
    devPanelLightingFxCollapsed: sanitizeBoolean(source.devPanelLightingFxCollapsed),
    devPanelCollisionDebugCollapsed: sanitizeBoolean(source.devPanelCollisionDebugCollapsed),
    devPanelActionsCollapsed: sanitizeBoolean(source.devPanelActionsCollapsed),
    showCollisionDebug: sanitizeBoolean(source.showCollisionDebug),
    showPlayerCollider: sanitizeBoolean(source.showPlayerCollider),
    showInteractionMarkers: sanitizeBoolean(source.showInteractionMarkers)
  };
}

export function loadPersistedWorldSettings(): PersistedWorldSettings {
  if (!canUseLocalStorage()) {
    return { version: 1 };
  }

  try {
    const rawValue =
      window.localStorage.getItem(WORLD_SETTINGS_KEY) ??
      window.localStorage.getItem(LEGACY_LEVA_SETTINGS_KEY);

    if (!rawValue) {
      return { version: 1 };
    }

    return sanitizeWorldSettings(JSON.parse(rawValue) as unknown);
  } catch {
    return { version: 1 };
  }
}

export function savePersistedWorldSettings(
  patch: Partial<Omit<PersistedWorldSettings, "version">>
): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const current = loadPersistedWorldSettings();
    const next = sanitizeWorldSettings({
      ...current,
      ...patch
    });

    window.localStorage.setItem(WORLD_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Ignore dev-only local storage failures.
  }
}
