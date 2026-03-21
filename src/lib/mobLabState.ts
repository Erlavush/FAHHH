import {
  DEFAULT_IMPORTED_MOB_PRESETS,
  DEFAULT_MOB_LAB_MOB_ID,
  cloneMobPreset,
  createDefaultMobPresetLibrary,
  getDefaultMobPresetSelection,
  getMobRenderMode,
  type CemAnimationNodeMap,
  type CemNodeDefinition,
  type ImportedMobPreset,
  type MobPresetLibrary
} from "./mobLab";
import { isFaceUvBounds, isTextureSize } from "./mobTextureLayout";

export type PersistedMobLabState = {
  version: 2;
  presets: MobPresetLibrary;
  activeMobId: string;
  selectedPartByMobId: Record<string, string>;
};

const MOB_LAB_STATE_KEY = "cozy-room-mob-lab";
const REMOVED_MOB_PRESET_IDS = new Set(["simplycats_penny", "minecraft_native_cat_tabby", "minecraft_vanilla_cat_rig", "better_cats_v4_tabby"]);

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isVector3(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

function isTextureOrigin(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

function isMobPartDefinition(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "label" in value &&
    typeof value.label === "string" &&
    "parentId" in value &&
    (value.parentId === null || typeof value.parentId === "string") &&
    "transform" in value &&
    typeof value.transform === "object" &&
    value.transform !== null &&
    "position" in value.transform &&
    isVector3(value.transform.position) &&
    "rotation" in value.transform &&
    isVector3(value.transform.rotation) &&
    "scale" in value.transform &&
    isVector3(value.transform.scale) &&
    "geometry" in value &&
    typeof value.geometry === "object" &&
    value.geometry !== null &&
    "size" in value.geometry &&
    isVector3(value.geometry.size) &&
    "offset" in value.geometry &&
    isVector3(value.geometry.offset) &&
    "textureOrigin" in value.geometry &&
    isTextureOrigin(value.geometry.textureOrigin)
  );
}

function isCubeFaceUvMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((entry) => entry === undefined || isFaceUvBounds(entry));
}

function isCemBoxDefinition(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "coordinates" in value &&
    Array.isArray(value.coordinates) &&
    value.coordinates.length === 6 &&
    value.coordinates.every((entry: unknown) => typeof entry === "number" && Number.isFinite(entry)) &&
    (("textureOrigin" in value && isTextureOrigin(value.textureOrigin)) ||
      ("faceUvs" in value && isCubeFaceUvMap(value.faceUvs))) &&
    (!("sizeAdd" in value) || value.sizeAdd === undefined || (typeof value.sizeAdd === "number" && Number.isFinite(value.sizeAdd)))
  );
}

function isCemAnimationNodeMap(value: unknown): value is CemAnimationNodeMap {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => entry === undefined || typeof entry === "string")
  );
}

function isCemNodeDefinition(value: unknown): value is CemNodeDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "label" in value &&
    typeof value.label === "string" &&
    (!("invertAxis" in value) || value.invertAxis === undefined || typeof value.invertAxis === "string") &&
    (!("mirrorTexture" in value) || value.mirrorTexture === undefined || typeof value.mirrorTexture === "string") &&
    (!("textureSrc" in value) || value.textureSrc === undefined || typeof value.textureSrc === "string") &&
    (!("emissiveTextureSrc" in value) || value.emissiveTextureSrc === undefined || typeof value.emissiveTextureSrc === "string") &&
    "transform" in value &&
    typeof value.transform === "object" &&
    value.transform !== null &&
    "position" in value.transform &&
    isVector3(value.transform.position) &&
    "rotation" in value.transform &&
    isVector3(value.transform.rotation) &&
    "scale" in value.transform &&
    isVector3(value.transform.scale) &&
    "boxes" in value &&
    Array.isArray(value.boxes) &&
    value.boxes.every(isCemBoxDefinition) &&
    "children" in value &&
    Array.isArray(value.children) &&
    value.children.every(isCemNodeDefinition)
  );
}

function isImportedMobPreset(value: unknown): value is ImportedMobPreset {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("label" in value) ||
    typeof value.label !== "string" ||
    !("textureSrc" in value) ||
    typeof value.textureSrc !== "string" ||
    ("textureSize" in value && value.textureSize !== undefined && !isTextureSize(value.textureSize)) ||
    !("parts" in value) ||
    !Array.isArray(value.parts) ||
    !value.parts.every(isMobPartDefinition) ||
    !("animation" in value) ||
    typeof value.animation !== "object" ||
    value.animation === null ||
    !("locomotion" in value) ||
    typeof value.locomotion !== "object" ||
    value.locomotion === null ||
    !("physics" in value) ||
    typeof value.physics !== "object" ||
    value.physics === null ||
    !("stage" in value) ||
    typeof value.stage !== "object" ||
    value.stage === null
  ) {
    return false;
  }

  const renderMode = getMobRenderMode(value as ImportedMobPreset);
  if (renderMode === "cem") {
    return (
      "cemModel" in value &&
      typeof value.cemModel === "object" &&
      value.cemModel !== null &&
      "animationProfile" in value.cemModel &&
      value.cemModel.animationProfile === "minecraft_cat" &&
      (!("animationNodes" in value.cemModel) || value.cemModel.animationNodes === undefined || isCemAnimationNodeMap(value.cemModel.animationNodes)) &&
      "rootNodes" in value.cemModel &&
      Array.isArray(value.cemModel.rootNodes) &&
      value.cemModel.rootNodes.every(isCemNodeDefinition)
    );
  }

  return true;
}

function getPresetRevision(preset: ImportedMobPreset | undefined): number {
  return preset?.presetRevision ?? 1;
}

function shouldKeepPersistedPreset(mobId: string, preset: ImportedMobPreset): boolean {
  if (REMOVED_MOB_PRESET_IDS.has(mobId)) {
    return false;
  }

  const defaultPreset = DEFAULT_IMPORTED_MOB_PRESETS[mobId];

  if (!defaultPreset) {
    return true;
  }

  return getPresetRevision(preset) === getPresetRevision(defaultPreset);
}

export function createDefaultMobLabState(): PersistedMobLabState {
  return {
    version: 2,
    presets: createDefaultMobPresetLibrary(),
    activeMobId: DEFAULT_MOB_LAB_MOB_ID,
    selectedPartByMobId: getDefaultMobPresetSelection()
  };
}

export function loadPersistedMobLabState(): PersistedMobLabState {
  if (!canUseLocalStorage()) {
    return createDefaultMobLabState();
  }

  try {
    const rawValue = window.localStorage.getItem(MOB_LAB_STATE_KEY);

    if (!rawValue) {
      return createDefaultMobLabState();
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("version" in parsedValue) ||
      ![1, 2, 3, 4].includes(parsedValue.version as number) ||
      !("activeMobId" in parsedValue) ||
      typeof parsedValue.activeMobId !== "string" ||
      !("selectedPartByMobId" in parsedValue) ||
      typeof parsedValue.selectedPartByMobId !== "object" ||
      parsedValue.selectedPartByMobId === null ||
      !("presets" in parsedValue) ||
      typeof parsedValue.presets !== "object" ||
      parsedValue.presets === null
    ) {
      return createDefaultMobLabState();
    }

    const nextState = createDefaultMobLabState();

    for (const [mobId, presetValue] of Object.entries(parsedValue.presets)) {
      if (!isImportedMobPreset(presetValue)) {
        continue;
      }

      if (!shouldKeepPersistedPreset(mobId, presetValue)) {
        continue;
      }

      nextState.presets[mobId] = cloneMobPreset(presetValue);
    }

    nextState.activeMobId =
      parsedValue.activeMobId in nextState.presets
        ? parsedValue.activeMobId
        : DEFAULT_MOB_LAB_MOB_ID;

    for (const [mobId, selectedPartId] of Object.entries(parsedValue.selectedPartByMobId)) {
      if (typeof selectedPartId === "string") {
        nextState.selectedPartByMobId[mobId] = selectedPartId;
      }
    }

    return nextState;
  } catch {
    return createDefaultMobLabState();
  }
}

export function savePersistedMobLabState(state: PersistedMobLabState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(MOB_LAB_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore browser storage failures in dev mode.
  }
}
