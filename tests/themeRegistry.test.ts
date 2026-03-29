import { describe, expect, it } from "vitest";
import { getThemeDefinition, THEME_REGISTRY } from "../src/lib/themeRegistry";

describe("themeRegistry", () => {
  it("contains the starter-cozy theme with correct colors", () => {
    const starter = THEME_REGISTRY["starter-cozy"];
    expect(starter).toBeDefined();
    expect(starter.label).toBe("Starter Cozy");
    expect(starter.colors.wall).toEqual(["#28201c", "#eee6db"]);
  });

  it("contains the midnight-modern theme", () => {
    const midnight = THEME_REGISTRY["midnight-modern"];
    expect(midnight).toBeDefined();
    expect(midnight.label).toBe("Midnight Modern");
    expect(midnight.price).toBeGreaterThan(0);
  });

  it("returns the default theme for unknown IDs", () => {
    const theme = getThemeDefinition("unknown-theme");
    expect(theme.id).toBe("starter-cozy");
  });

  it("returns the requested theme for valid IDs", () => {
    const theme = getThemeDefinition("midnight-modern");
    expect(theme.id).toBe("midnight-modern");
  });
});
