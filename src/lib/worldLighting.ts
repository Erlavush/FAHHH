import { Color, Vector3 } from "three";

const MINUTES_PER_DAY = 24 * 60;
const SUN_DISTANCE = 24;
const MOON_DISTANCE = 24;
const DIAGONAL_ORBIT_AXIS = new Vector3(-1, 0, 1).normalize();

export interface WorldLightingState {
  wrappedMinutes: number;
  solarAltitude: number;
  daylightAmount: number;
  twilightAmount: number;
  twilightFillAmount: number;
  interiorDaylightAmount: number;
  nightFactor: number;
  sunIntensity: number;
  moonIntensity: number;
  sunPosition: [number, number, number];
  moonPosition: [number, number, number];
  sunColor: string;
  moonColor: string;
  skyColor: string;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  toneMappingExposure: number;
  aoIntensity: number;
  aoRadius: number;
  bloomIntensity: number;
  bloomThreshold: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  lampNightFactor: number;
  isDay: boolean;
  isNight: boolean;
  windowDaylightAmount: number;
}

function wrapWorldMinutes(minutes: number): number {
  const wrappedMinutes = minutes % MINUTES_PER_DAY;
  return wrappedMinutes < 0 ? wrappedMinutes + MINUTES_PER_DAY : wrappedMinutes;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const normalizedValue = clamp01((value - edge0) / (edge1 - edge0));
  return normalizedValue * normalizedValue * (3 - 2 * normalizedValue);
}

export function mixNumber(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp01(amount);
}

export function mixColor(start: string, end: string, amount: number): string {
  return new Color(start).lerp(new Color(end), clamp01(amount)).getStyle();
}

function composeSkyColor(daylightAmount: number, twilightAmount: number): string {
  const nightColor = new Color("#091428");
  const dawnColor = new Color("#f0b777");
  const dayColor = new Color("#79ccff");

  const twilightBlend = nightColor.clone().lerp(dawnColor, twilightAmount);
  return twilightBlend.lerp(dayColor, daylightAmount).getStyle();
}

function composeGroundColor(daylightAmount: number, twilightAmount: number): string {
  const nightColor = new Color("#1d1512");
  const dawnColor = new Color("#5b4031");
  const dayColor = new Color("#5d4b40");

  const twilightBlend = nightColor.clone().lerp(dawnColor, twilightAmount);
  return twilightBlend.lerp(dayColor, daylightAmount).getStyle();
}

export function getWorldLightingState(worldMinutes: number): WorldLightingState {
  const wrappedMinutes = wrapWorldMinutes(worldMinutes);
  const dayFraction = wrappedMinutes / MINUTES_PER_DAY;
  const solarAngle = dayFraction * Math.PI * 2 - Math.PI / 2;
  const solarAltitude = Math.sin(solarAngle);
  const daylightAmount = smoothstep(-0.12, 0.12, solarAltitude);
  const twilightAmount = 1 - smoothstep(0.1, 0.5, Math.abs(solarAltitude));
  const twilightFillAmount = clamp01(daylightAmount + twilightAmount * 0.48);
  const interiorDaylightAmount = clamp01(daylightAmount + twilightAmount * 0.42);
  const nightFactor = 1 - daylightAmount;
  const horizontalOrbitDistance = Math.cos(solarAngle) * SUN_DISTANCE;
  const horizontalOffset = DIAGONAL_ORBIT_AXIS.clone().multiplyScalar(horizontalOrbitDistance);
  const sunPositionVector = new Vector3(
    horizontalOffset.x,
    mixNumber(-8.5, 12.5, (solarAltitude + 1) / 2),
    horizontalOffset.z
  );
  const moonPositionVector = sunPositionVector.clone().multiplyScalar(-MOON_DISTANCE / SUN_DISTANCE);
  const baseSunIntensity =
    daylightAmount * mixNumber(0.28, 1.45, clamp01((solarAltitude + 0.05) / 1.05));
  const sunIntensity = baseSunIntensity + twilightAmount * 0.08;
  const moonIntensity = nightFactor * mixNumber(0.02, 0.2, clamp01((-solarAltitude + 0.1) / 1.1));
  const windowDaylightAmount =
    clamp01(smoothstep(-0.04, 0.2, solarAltitude) + twilightAmount * 0.32);

  return {
    wrappedMinutes,
    solarAltitude,
    daylightAmount,
    twilightAmount,
    twilightFillAmount,
    interiorDaylightAmount,
    nightFactor,
    sunIntensity,
    moonIntensity,
    sunPosition: sunPositionVector.toArray() as [number, number, number],
    moonPosition: moonPositionVector.toArray() as [number, number, number],
    sunColor: mixColor("#ffd2a0", "#fff1d9", daylightAmount),
    moonColor: mixColor("#9bb7e8", "#dbe6ff", nightFactor),
    skyColor: composeSkyColor(daylightAmount, twilightAmount),
    hemisphereSkyColor: mixColor("#42506c", "#dce8f8", twilightFillAmount),
    hemisphereGroundColor: mixColor(
      "#35271f",
      composeGroundColor(daylightAmount, twilightAmount),
      twilightFillAmount
    ),
    toneMappingExposure: mixNumber(0.96, 1.04, daylightAmount) + twilightAmount * 0.08,
    aoIntensity: mixNumber(0.56, 0.82, daylightAmount) - twilightAmount * 0.18,
    aoRadius: mixNumber(0.48, 0.44, daylightAmount),
    bloomIntensity: mixNumber(0.24, 0.14, daylightAmount) + twilightAmount * 0.06,
    bloomThreshold: mixNumber(1.02, 1.5, daylightAmount),
    vignetteOffset: mixNumber(0.12, 0.2, daylightAmount),
    vignetteDarkness:
      mixNumber(0.28, 0.24, daylightAmount) +
      nightFactor * 0.06 -
      twilightAmount * 0.08,
    lampNightFactor: smoothstep(0.24, -0.02, solarAltitude),
    isDay: interiorDaylightAmount > 0.5,
    isNight: interiorDaylightAmount < 0.14,
    windowDaylightAmount
  };
}
