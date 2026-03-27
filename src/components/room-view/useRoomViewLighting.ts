import { useMemo } from "react";
import type { RoomFurniturePlacement } from "../../lib/roomState";
import {
  clamp01,
  getWorldLightingState,
  mixColor,
  mixNumber,
  type WorldLightingState
} from "../../lib/worldLighting";
import {
  DESKTOP_COMPOSER_MULTISAMPLING,
  DESKTOP_MOON_SHADOW_MAP_SIZE,
  DESKTOP_SUN_SHADOW_MAP_SIZE,
  TOUCH_COMPOSER_MULTISAMPLING,
  TOUCH_MOON_SHADOW_MAP_SIZE,
  TOUCH_SUN_SHADOW_MAP_SIZE
} from "./constants";

type UseRoomViewLightingOptions = {
  ambientMultiplier: number;
  brightness: number;
  contrast: number;
  furniture: RoomFurniturePlacement[];
  saturation: number;
  shouldUseReducedRenderQuality: boolean;
  sunIntensityMultiplier: number;
  worldTimeMinutes: number;
};

export type RoomViewLightingDerivation = {
  ambientLightIntensity: number;
  hemisphereGroundColor: string;
  hemisphereLightIntensity: number;
  hemisphereSkyColor: string;
  lightingState: WorldLightingState;
  moonOpacity: number;
  moonShadowMapSize: number;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  pointLightVisible: boolean;
  postProcessing: {
    aoIntensity: number;
    aoRadius: number;
    bloomIntensity: number;
    bloomThreshold: number;
    brightness: number;
    contrast: number;
    multisampling: number;
    saturation: number;
    shouldApplyBrightnessContrast: boolean;
    shouldApplyHueSaturation: boolean;
    shouldUseAmbientOcclusion: boolean;
    shouldUseBloom: boolean;
    vignetteDarkness: number;
    vignetteOffset: number;
  };
  practicalLampFactor: number;
  roomSurfaceLightAmount: number;
  sceneBackdrop: string;
  sceneFogColor: string;
  sceneToneMappingExposure: number;
  sunLightEnabled: boolean;
  sunLightIntensity: number;
  sunShadowMapSize: number;
  sunShadowNormalBias: number;
  sunShadowRadius: number;
  windowSurfaceLightAmount: number;
};

export function deriveRoomViewLighting({
  ambientMultiplier,
  brightness,
  contrast,
  furniture,
  saturation,
  shouldUseReducedRenderQuality,
  sunIntensityMultiplier,
  worldTimeMinutes
}: UseRoomViewLightingOptions): RoomViewLightingDerivation {
  const lightingState = getWorldLightingState(worldTimeMinutes);
  const floorLampCount = furniture.filter((item) => item.type === "floor_lamp").length;
  const ceilingLightCount = furniture.filter((item) => item.type === "ceiling_light").length;
  const practicalLightUnits = floorLampCount / 2 + ceilingLightCount * 0.7;
  const practicalLampFactor = Math.min(1, practicalLightUnits) * lightingState.nightFactor;
  const pointLightPosition: [number, number, number] =
    ceilingLightCount > 0 ? [0, 3.4, 0] : [0, 2.55, -1.45];
  const roomSurfaceLightAmount = clamp01(
    lightingState.interiorDaylightAmount + practicalLampFactor * 0.22
  );
  const windowSurfaceLightAmount = clamp01(
    lightingState.windowDaylightAmount + practicalLampFactor * 0.08
  );
  const twilightSafetyAmount = lightingState.twilightAmount;
  const skyGradientTopColor = mixColor(
    mixColor("#071128", "#f2a85f", twilightSafetyAmount * 0.82),
    "#2fa8ff",
    lightingState.daylightAmount
  );
  const skyGradientBottomColor = mixColor(
    mixColor("#132247", "#ffd7ab", twilightSafetyAmount * 0.76),
    "#d6f2ff",
    lightingState.daylightAmount
  );
  const sceneBackdrop = `linear-gradient(180deg, ${skyGradientTopColor} 0%, ${mixColor(
    skyGradientTopColor,
    skyGradientBottomColor,
    0.45
  )} 60%, ${skyGradientBottomColor} 100%)`;
  const sceneFogColor = mixColor(skyGradientTopColor, skyGradientBottomColor, 0.68);
  const sceneToneMappingExposure =
    lightingState.toneMappingExposure + practicalLampFactor * 0.16;
  const composerAoIntensity =
    lightingState.aoIntensity * mixNumber(0.08, 1, 1 - twilightSafetyAmount);
  const composerBloomIntensity =
    lightingState.bloomIntensity * mixNumber(0.6, 1, 1 - twilightSafetyAmount);
  const composerVignetteDarkness =
    lightingState.vignetteDarkness * mixNumber(0.18, 1, 1 - twilightSafetyAmount);
  const composerBrightness = brightness - 1 + twilightSafetyAmount * 0.12;
  const composerContrast = contrast - 1;
  const shouldApplyHueSaturation = Math.abs(saturation - 1) > 0.001;
  const shouldApplyBrightnessContrast =
    Math.abs(composerBrightness) > 0.001 || Math.abs(composerContrast) > 0.001;
  const composerMultisampling = shouldUseReducedRenderQuality
    ? TOUCH_COMPOSER_MULTISAMPLING
    : DESKTOP_COMPOSER_MULTISAMPLING;
  const sunShadowMapSize = shouldUseReducedRenderQuality
    ? TOUCH_SUN_SHADOW_MAP_SIZE
    : DESKTOP_SUN_SHADOW_MAP_SIZE;
  const moonShadowMapSize = shouldUseReducedRenderQuality
    ? TOUCH_MOON_SHADOW_MAP_SIZE
    : DESKTOP_MOON_SHADOW_MAP_SIZE;
  const shouldUseAmbientOcclusion =
    !shouldUseReducedRenderQuality && composerAoIntensity > 0.02;
  const shouldUseBloom = composerBloomIntensity > 0.02;
  const hemisphereLightIntensity = (
    mixNumber(0.22, 0.38, lightingState.daylightAmount) +
    lightingState.twilightFillAmount * 0.2 +
    practicalLampFactor * 0.16
  ) * ambientMultiplier;

  return {
    ambientLightIntensity:
      lightingState.nightFactor * 0.08 +
      lightingState.twilightAmount * 0.12 +
      practicalLampFactor * 0.1,
    hemisphereGroundColor: mixColor(
      lightingState.hemisphereGroundColor,
      "#7b5e49",
      practicalLampFactor * 0.6
    ),
    hemisphereLightIntensity,
    hemisphereSkyColor: mixColor(
      lightingState.hemisphereSkyColor,
      "#ffd9b5",
      practicalLampFactor * 0.55
    ),
    lightingState,
    moonOpacity: clamp01(lightingState.nightFactor),
    moonShadowMapSize,
    pointLightIntensity: practicalLampFactor * 0.82,
    pointLightPosition,
    pointLightVisible: practicalLampFactor > 0.001,
    postProcessing: {
      aoIntensity: composerAoIntensity,
      aoRadius: lightingState.aoRadius,
      bloomIntensity: composerBloomIntensity,
      bloomThreshold: lightingState.bloomThreshold,
      brightness: composerBrightness,
      contrast: composerContrast,
      multisampling: composerMultisampling,
      saturation,
      shouldApplyBrightnessContrast,
      shouldApplyHueSaturation,
      shouldUseAmbientOcclusion,
      shouldUseBloom,
      vignetteDarkness: composerVignetteDarkness,
      vignetteOffset: lightingState.vignetteOffset
    },
    practicalLampFactor,
    roomSurfaceLightAmount,
    sceneBackdrop,
    sceneFogColor,
    sceneToneMappingExposure,
    sunLightEnabled:
      lightingState.sunIntensity > 0.08 && lightingState.solarAltitude > 0.18,
    sunLightIntensity: lightingState.sunIntensity * sunIntensityMultiplier,
    sunShadowMapSize,
    sunShadowNormalBias: mixNumber(0.01, 0.03, lightingState.daylightAmount),
    sunShadowRadius: mixNumber(4.4, 3.2, lightingState.daylightAmount),
    windowSurfaceLightAmount
  };
}

export function useRoomViewLighting(
  options: UseRoomViewLightingOptions
): RoomViewLightingDerivation {
  return useMemo(
    () => deriveRoomViewLighting(options),
    [
      options.ambientMultiplier,
      options.brightness,
      options.contrast,
      options.furniture,
      options.saturation,
      options.shouldUseReducedRenderQuality,
      options.sunIntensityMultiplier,
      options.worldTimeMinutes
    ]
  );
}
