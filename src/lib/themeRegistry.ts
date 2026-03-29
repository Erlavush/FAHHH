export interface ThemeColors {
  wall: [string, string];
  baseboard: [string, string];
  trim: [string, string];
  wallRail: [string, string];
  cornerTrim: [string, string];
  ceiling: [string, string];
  ceilingTrim: [string, string];
  floorWood: [string, string];
  floorPlatform: [string, string];
  floorEdge: [string, string];
  floorLip: [string, string];
}

export interface ThemeDefinition {
  id: string;
  label: string;
  shortDescription: string;
  price: number;
  unlockKey: string;
  colors: ThemeColors;
}

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  "starter-cozy": {
    id: "starter-cozy",
    label: "Starter Cozy",
    shortDescription: "The original warm and inviting room theme.",
    price: 0,
    unlockKey: "theme-starter-cozy",
    colors: {
      wall: ["#28201c", "#eee6db"],
      baseboard: ["#775b46", "#8b6345"],
      trim: ["#725a48", "#f5eee3"],
      wallRail: ["#856652", "#a17856"],
      cornerTrim: ["#6d5443", "#e8dfd2"],
      ceiling: ["#43342c", "#f4efe8"],
      ceilingTrim: ["#5d493d", "#d9ccb9"],
      floorWood: ["#70472f", "#8f5f3f"],
      floorPlatform: ["#1f1714", "#34261f"],
      floorEdge: ["#825f42", "#d6a56d"],
      floorLip: ["#33241a", "#7a4a2d"]
    }
  },
  "midnight-modern": {
    id: "midnight-modern",
    label: "Midnight Modern",
    shortDescription: "A sleek, dark theme for late-night productivity and focus.",
    price: 150,
    unlockKey: "theme-midnight-modern",
    colors: {
      wall: ["#0f172a", "#1e293b"],
      baseboard: ["#1e293b", "#334155"],
      trim: ["#0f172a", "#1e293b"],
      wallRail: ["#334155", "#475569"],
      cornerTrim: ["#1e293b", "#334155"],
      ceiling: ["#020617", "#0f172a"],
      ceilingTrim: ["#1e293b", "#334155"],
      floorWood: ["#0f172a", "#1e293b"],
      floorPlatform: ["#020617", "#0f172a"],
      floorEdge: ["#1e293b", "#334155"],
      floorLip: ["#0f172a", "#1e293b"]
    }
  }
};

export const DEFAULT_THEME_ID = "starter-cozy";

export function getThemeDefinition(id: string): ThemeDefinition {
  return THEME_REGISTRY[id] || THEME_REGISTRY[DEFAULT_THEME_ID];
}
