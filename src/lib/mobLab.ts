import alexsMobsRaccoonPreset from "./mob-presets/alexs_mobs_raccoon.json";
import betterCatGlbPreset from "./mob-presets/better_cat_glb.json";
import betterCatBaseBodyBaseEarsBobtailPreset from "./mob-presets/better_cat_base_body_base_ears_bobtail.json";
import betterCatFluffyBodyBaseEarsFlufftailPreset from "./mob-presets/better_cat_fluffy_body_base_ears_flufftail.json";
import betterCatFluffyBodyBigEarsBobtailPreset from "./mob-presets/better_cat_fluffy_body_big_ears_bobtail.json";
import betterCatTabbyFluffyTailOrangeEyeGreyPreset from "./mob-presets/better_cat_tabby_fluffy_tail_orange_eye_grey.json";
import betterCatVariantBlackPreset from "./mob-presets/better_cat_variant_black.json";
import betterCatVariantBritishShorthairPreset from "./mob-presets/better_cat_variant_british_shorthair.json";
import betterCatVariantCalicoPreset from "./mob-presets/better_cat_variant_calico.json";
import betterCatVariantRagdollPreset from "./mob-presets/better_cat_variant_ragdoll.json";
import betterCatVariantRedPreset from "./mob-presets/better_cat_variant_red.json";
import betterCatVariantSiamesePreset from "./mob-presets/better_cat_variant_siamese.json";
import betterCatVariantTabbyPreset from "./mob-presets/better_cat_variant_tabby.json";
import betterCatVariantWhitePreset from "./mob-presets/better_cat_variant_white.json";
import type { BetterCatGlbVariantSelection } from "./betterCatGlb";
import type { BetterCatVariantId } from "./catVariants";
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
  variantId?: BetterCatVariantId;
  presetRevision?: number;
  renderMode?: MobRenderMode;
  editorTransformSpace?: MobEditorTransformSpace;
  betterCatVariant?: BetterCatGlbVariantSelection;
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

export const DEFAULT_MOB_LAB_MOB_ID = "better_cat_glb";

const IMPORTED_MOB_PRESETS = [
  betterCatGlbPreset as unknown as ImportedMobPreset,
  betterCatVariantTabbyPreset as unknown as ImportedMobPreset,
  betterCatVariantRedPreset as unknown as ImportedMobPreset,
  betterCatVariantCalicoPreset as unknown as ImportedMobPreset,
  betterCatVariantSiamesePreset as unknown as ImportedMobPreset,
  betterCatVariantBritishShorthairPreset as unknown as ImportedMobPreset,
  betterCatVariantRagdollPreset as unknown as ImportedMobPreset,
  betterCatVariantBlackPreset as unknown as ImportedMobPreset,
  betterCatVariantWhitePreset as unknown as ImportedMobPreset,
  betterCatTabbyFluffyTailOrangeEyeGreyPreset as unknown as ImportedMobPreset,
  betterCatBaseBodyBaseEarsBobtailPreset as unknown as ImportedMobPreset,
  betterCatFluffyBodyBaseEarsFlufftailPreset as unknown as ImportedMobPreset,
  betterCatFluffyBodyBigEarsBobtailPreset as unknown as ImportedMobPreset,
  alexsMobsRaccoonPreset as unknown as ImportedMobPreset
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
