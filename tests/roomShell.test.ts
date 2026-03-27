import { describe, expect, it } from "vitest";
import {
  getRoomShellMaterialProps,
  getRoomShellRenderMode
} from "../src/components/room-view/RoomShell";

describe("RoomShell occlusion helpers", () => {
  it("keeps visible surfaces in the normal color pass", () => {
    expect(getRoomShellRenderMode(true)).toBe("visible");
    expect(getRoomShellMaterialProps("visible")).toEqual({});
  });

  it("switches occluded surfaces into shadow-only mode", () => {
    expect(getRoomShellRenderMode(false)).toBe("shadow_only");
    expect(getRoomShellMaterialProps("shadow_only")).toEqual({
      colorWrite: false,
      depthWrite: false
    });
  });
});
