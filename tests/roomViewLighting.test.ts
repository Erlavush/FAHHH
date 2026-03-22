import { describe, expect, it } from "vitest";
import {
  DESKTOP_COMPOSER_MULTISAMPLING,
  DESKTOP_MOON_SHADOW_MAP_SIZE,
  DESKTOP_SUN_SHADOW_MAP_SIZE,
  TOUCH_COMPOSER_MULTISAMPLING,
  TOUCH_MOON_SHADOW_MAP_SIZE,
  TOUCH_SUN_SHADOW_MAP_SIZE
} from "../src/components/room-view/constants";
import { deriveRoomViewLighting } from "../src/components/room-view/useRoomViewLighting";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

function createFloorLampPlacement(id: string): RoomFurniturePlacement {
  return {
    id,
    type: "floor_lamp",
    surface: "floor",
    position: [0, 0, 0],
    rotationY: 0,
    ownedFurnitureId: `owned-${id}`
  };
}

function deriveLighting(overrides: Partial<Parameters<typeof deriveRoomViewLighting>[0]> = {}) {
  return deriveRoomViewLighting({
    ambientMultiplier: 1,
    brightness: 1,
    contrast: 1,
    furniture: [],
    saturation: 1,
    shouldUseReducedRenderQuality: false,
    sunIntensityMultiplier: 1,
    worldTimeMinutes: 12 * 60,
    ...overrides
  });
}

describe("deriveRoomViewLighting", () => {
  it("uses desktop-quality post processing when render quality is not reduced", () => {
    const lighting = deriveLighting();

    expect(lighting.postProcessing.multisampling).toBe(DESKTOP_COMPOSER_MULTISAMPLING);
    expect(lighting.sunShadowMapSize).toBe(DESKTOP_SUN_SHADOW_MAP_SIZE);
    expect(lighting.moonShadowMapSize).toBe(DESKTOP_MOON_SHADOW_MAP_SIZE);
    expect(lighting.postProcessing.shouldUseAmbientOcclusion).toBe(true);
  });

  it("drops expensive passes and shadow sizes in reduced-quality mode", () => {
    const lighting = deriveLighting({
      shouldUseReducedRenderQuality: true
    });

    expect(lighting.postProcessing.multisampling).toBe(TOUCH_COMPOSER_MULTISAMPLING);
    expect(lighting.sunShadowMapSize).toBe(TOUCH_SUN_SHADOW_MAP_SIZE);
    expect(lighting.moonShadowMapSize).toBe(TOUCH_MOON_SHADOW_MAP_SIZE);
    expect(lighting.postProcessing.shouldUseAmbientOcclusion).toBe(false);
  });

  it("brightens the room at night when floor lamps are present", () => {
    const withoutLamps = deriveLighting({
      worldTimeMinutes: 0
    });
    const withLamps = deriveLighting({
      furniture: [
        createFloorLampPlacement("lamp-1"),
        createFloorLampPlacement("lamp-2")
      ],
      worldTimeMinutes: 0
    });

    expect(withLamps.practicalLampFactor).toBeGreaterThan(withoutLamps.practicalLampFactor);
    expect(withLamps.roomSurfaceLightAmount).toBeGreaterThan(withoutLamps.roomSurfaceLightAmount);
    expect(withLamps.ambientLightIntensity).toBeGreaterThan(withoutLamps.ambientLightIntensity);
    expect(withLamps.pointLightVisible).toBe(true);
    expect(withLamps.pointLightIntensity).toBeGreaterThan(0);
  });
});
