import alexsMobsRaccoonPreset from "./mob-presets/alexs_mobs_raccoon.json";
import betterCatGlbPreset from "./mob-presets/better_cat_glb.json";
import type { CubeFaceUvMap, TextureSize } from "./mobTextureLayout";
import type { Vector3Tuple } from "./roomState";

export type MobPreviewMode = "idle" | "walk_in_place" | "loop_path";
export type MobRenderMode = "box" | "cem" | "glb";
export type MobEditorTransformSpace = "local_absolute" | "model_delta";

export type MobPartRole =
  | "body"
  | "head"
  | "tail"
  | "ear_left"
  | "ear_right"
  | "front_left_leg"
  | "front_right_leg"
  | "rear_left_leg"
  | "rear_right_leg"
  | "snout";

export type MobPartGeometry = {
  size: Vector3Tuple;
  offset: Vector3Tuple;
  textureOrigin: [number, number];
  mirror?: boolean;
};

export type MobPartTransform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

export type MobPartDefinition = {
  id: string;
  label: string;
  parentId: string | null;
  role?: MobPartRole;
  geometry: MobPartGeometry;
  transform: MobPartTransform;
};

export type MobIdleAnimationSettings = {
  frequency: number;
  bodyBob: number;
  headYaw: number;
  headPitch: number;
  tailYaw: number;
  tailPitch: number;
  earPitch: number;
  earRoll: number;
};

export type MobWalkAnimationSettings = {
  strideRate: number;
  limbSwing: number;
  bodyBob: number;
  bodyRoll: number;
  headNod: number;
  tailYaw: number;
  tailPitch: number;
};

export type MobAnimationSettings = {
  idle: MobIdleAnimationSettings;
  walk: MobWalkAnimationSettings;
};

export type MobLocomotionSettings = {
  mode: MobPreviewMode;
  speed: number;
  turnResponsiveness: number;
  loopRadius: number;
};

export type MobPhysicsSettings = {
  groundOffset: number;
  colliderSize: Vector3Tuple;
  colliderOffset: Vector3Tuple;
  showCollider: boolean;
};

export type MobStageSettings = {
  modelScale: number;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
};

export type CemBoxDefinition = {
  coordinates: [number, number, number, number, number, number];
  textureOrigin?: [number, number];
  faceUvs?: CubeFaceUvMap;
  sizeAdd?: number;
};

export type CemNodeDefinition = {
  id: string;
  label: string;
  invertAxis?: string;
  mirrorTexture?: string;
  textureSrc?: string;
  emissiveTextureSrc?: string;
  transform: MobPartTransform;
  boxes: CemBoxDefinition[];
  children: CemNodeDefinition[];
};

export type CemAnimationNodeMap = {
  bodyId?: string;
  headId?: string;
  tailRootId?: string;
  tailLowerId?: string;
  leftEarId?: string;
  rightEarId?: string;
  frontLeftLegId?: string;
  frontRightLegId?: string;
  rearLeftLegId?: string;
  rearRightLegId?: string;
};

export type CemModelDefinition = {
  animationProfile: string;
  hiddenNodeIds?: string[];
  animationNodes?: CemAnimationNodeMap;
  rootNodes: CemNodeDefinition[];
};

export type ImportedMobPreset = {
  id: string;
  label: string;
  sourceLabel: string;
  sourceMobPath: string;
  presetRevision?: number;
  renderMode?: MobRenderMode;
  editorTransformSpace?: MobEditorTransformSpace;
  textureSrc: string;
  textureSize?: TextureSize;
  parts: MobPartDefinition[];
  animation: MobAnimationSettings;
  locomotion: MobLocomotionSettings;
  physics: MobPhysicsSettings;
  stage: MobStageSettings;
  cemModel?: CemModelDefinition;
};

export type MobPresetLibrary = Record<string, ImportedMobPreset>;

export const DEFAULT_MOB_LAB_MOB_ID = "alexs_mobs_raccoon";

const IMPORTED_MOB_PRESETS = [
  alexsMobsRaccoonPreset as unknown as ImportedMobPreset,
  betterCatGlbPreset as unknown as ImportedMobPreset
];

export function cloneMobPreset<T>(preset: T): T {
  return JSON.parse(JSON.stringify(preset)) as T;
}

export function getMobRenderMode(preset: ImportedMobPreset): MobRenderMode {
  return preset.renderMode ?? "box";
}

export const DEFAULT_IMPORTED_MOB_PRESETS: MobPresetLibrary = Object.fromEntries(
  IMPORTED_MOB_PRESETS.map((preset) => [preset.id, cloneMobPreset(preset)])
);

export function createDefaultMobPresetLibrary(): MobPresetLibrary {
  return cloneMobPreset(DEFAULT_IMPORTED_MOB_PRESETS);
}

export function getDefaultMobPresetSelection(): Record<string, string> {
  return Object.fromEntries(
    IMPORTED_MOB_PRESETS.map((preset) => [preset.id, preset.parts[0]?.id ?? "body"])
  );
}
