import { describe, expect, it } from "vitest";
import { getWorldLightingState } from "../src/lib/worldLighting";

function getLightingAtHour(hour: number) {
  return getWorldLightingState(hour * 60);
}

describe("world lighting", () => {
  it("keeps the reported dawn and dusk ranges above blackout thresholds", () => {
    const blackoutRegressionHours = [
      5.6,
      5.8,
      6.0,
      6.2,
      6.4,
      17.6,
      17.8,
      18.0,
      18.2,
      18.4
    ];

    for (const hour of blackoutRegressionHours) {
      const lighting = getLightingAtHour(hour);

      expect(lighting.interiorDaylightAmount).toBeGreaterThanOrEqual(0.38);
      expect(lighting.windowDaylightAmount).toBeGreaterThanOrEqual(0.3);
      expect(lighting.toneMappingExposure).toBeGreaterThanOrEqual(1);
      expect(lighting.sunIntensity + lighting.moonIntensity).toBeGreaterThanOrEqual(0.12);
    }
  });

  it("keeps post-processing values in safe bounds throughout the day", () => {
    const sampleHours = [0, 3, 6, 9, 12, 15, 18, 21];

    for (const hour of sampleHours) {
      const lighting = getLightingAtHour(hour);

      expect(lighting.aoIntensity).toBeGreaterThanOrEqual(0);
      expect(lighting.aoIntensity).toBeLessThanOrEqual(1);
      expect(lighting.vignetteDarkness).toBeGreaterThanOrEqual(0);
      expect(lighting.vignetteDarkness).toBeLessThan(0.5);
      expect(Number.isFinite(lighting.toneMappingExposure)).toBe(true);
      expect(Number.isFinite(lighting.sunIntensity)).toBe(true);
      expect(Number.isFinite(lighting.moonIntensity)).toBe(true);
    }
  });
});
