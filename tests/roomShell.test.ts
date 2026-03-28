import { describe, expect, it } from "vitest";
import {
  getRoomShellMaterialProps,
  getRoomShellRenderMode,
  shouldRoomShellCastShadow,
  shouldRoomShellReceiveShadow
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

  it("casts shadows in both visible and shadow-only modes", () => {
    expect(shouldRoomShellCastShadow("visible", true)).toBe(true);
    expect(shouldRoomShellCastShadow("shadow_only", true)).toBe(true);
    expect(shouldRoomShellCastShadow("visible", false)).toBe(false);
    expect(shouldRoomShellCastShadow("shadow_only", false)).toBe(false);
  });

  it("receives shadows only in visible mode", () => {
    expect(shouldRoomShellReceiveShadow("visible", true)).toBe(true);
    expect(shouldRoomShellReceiveShadow("shadow_only", true)).toBe(false);
    expect(shouldRoomShellReceiveShadow("visible", false)).toBe(false);
    expect(shouldRoomShellReceiveShadow("shadow_only", false)).toBe(false);
  });
});