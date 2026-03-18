import { describe, expect, it } from "vitest";
import {
  createStarterFurniture,
  createStarterRoom,
  STARTER_LAYOUT_VERSION
} from "../src/lib/room/starterRoom";

describe("starter room", () => {
  it("creates a shared room record with the starter layout version", () => {
    const room = createStarterRoom("couple-a");

    expect(room.coupleId).toBe("couple-a");
    expect(room.layoutVersion).toBe(STARTER_LAYOUT_VERSION);
    expect(room.roomTheme).toBe("starter-cozy");
  });

  it("includes the essential default furniture and locks it", () => {
    const furniture = createStarterFurniture("couple-a", "user-a");
    const ids = furniture.map((item) => item.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "starter-bed",
        "starter-desk",
        "starter-pc",
        "starter-side-table",
        "starter-vase",
        "starter-small-frame",
        "starter-poster",
        "starter-wall-frame",
        "starter-floor-rug"
      ])
    );
    expect(furniture.every((item) => item.locked)).toBe(true);
  });
});
