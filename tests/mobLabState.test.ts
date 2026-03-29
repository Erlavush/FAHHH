import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultMobLabState, loadPersistedMobLabState, type PersistedMobLabState } from "../src/lib/mobLabState";
import {
  DEFAULT_IMPORTED_MOB_PRESETS,
  DEFAULT_MOB_LAB_MOB_ID,
  type ImportedMobPreset
} from "../src/lib/mobLab";

const STORAGE_KEY = "cozy-room-mob-lab";

describe("mobLabState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("drops removed built-in cat presets from persisted state", () => {
    const state = createDefaultMobLabState();
    const staleCatPreset = JSON.parse(JSON.stringify(state.presets.better_cat_glb)) as ImportedMobPreset;
    const stalePartId = staleCatPreset.parts[0]?.id ?? "body";
    staleCatPreset.id = "minecraft_native_cat_tabby";
    staleCatPreset.label = "Removed Cat Preset";

    const persistedState: PersistedMobLabState | Record<string, unknown> = {
      version: 4,
      activeMobId: staleCatPreset.id,
      selectedPartByMobId: {
        [staleCatPreset.id]: stalePartId
      },
      presets: {
        [staleCatPreset.id]: staleCatPreset
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const loadedState = loadPersistedMobLabState();

    expect(loadedState.presets[staleCatPreset.id]).toBeUndefined();
    expect(loadedState.activeMobId).toBe(DEFAULT_MOB_LAB_MOB_ID);
  });

  it("defaults the Mob Lab to the Better Cats preset", () => {
    expect(DEFAULT_MOB_LAB_MOB_ID).toBe("better_cat_glb");
  });

  it("includes the exported Better Cats tabby preset in the built-in library", () => {
    expect(DEFAULT_IMPORTED_MOB_PRESETS.better_cat_tabby_fluffy_tail_orange_eye_grey).toMatchObject({
      label: "Better Cat - Tabby Fluffy Tail",
      sourceMobPath: "/models/tabbyfluffytailoreangeeyegreycat.glb",
      renderMode: "glb"
    });
  });

  it("includes the three new Better Cats shape export presets in the built-in library", () => {
    expect(DEFAULT_IMPORTED_MOB_PRESETS.better_cat_base_body_base_ears_bobtail).toMatchObject({
      label: "Better Cat - Base Body Base Ears Bobtail",
      sourceMobPath: "/models/body-base,ear-base,tail-bobtail.glb",
      renderMode: "glb",
      betterCatVariant: {
        body: "base",
        tail: "bob",
        ear: "base"
      }
    });
    expect(DEFAULT_IMPORTED_MOB_PRESETS.better_cat_fluffy_body_base_ears_flufftail).toMatchObject({
      label: "Better Cat - Fluffy Body Base Ears Fluffy Tail",
      sourceMobPath: "/models/flufftail_fluffybase_baseears.glb",
      renderMode: "glb",
      betterCatVariant: {
        body: "fluffy",
        tail: "fluffy",
        ear: "base"
      }
    });
    expect(DEFAULT_IMPORTED_MOB_PRESETS.better_cat_fluffy_body_big_ears_bobtail).toMatchObject({
      label: "Better Cat - Fluffy Body Big Ears Bobtail",
      sourceMobPath: "/models/fluffybase_bigears_bobtail.glb",
      renderMode: "glb",
      betterCatVariant: {
        body: "fluffy",
        tail: "bob",
        ear: "big"
      }
    });
  });

  it("keeps imported custom presets that are not part of the built-in library", () => {
    const state = createDefaultMobLabState();
    const customPreset = JSON.parse(JSON.stringify(state.presets.better_cat_glb)) as ImportedMobPreset;
    const customPartId = customPreset.parts[0]?.id ?? "body";
    customPreset.id = "custom_cat_test";
    customPreset.label = "Custom Cat Test";

    const persistedState = {
      version: 4,
      activeMobId: customPreset.id,
      selectedPartByMobId: {
        [customPreset.id]: customPartId
      },
      presets: {
        [customPreset.id]: customPreset
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const loadedState = loadPersistedMobLabState();

    expect(loadedState.presets[customPreset.id].label).toBe("Custom Cat Test");
  });

  it("persists and restores variantId for Better Cats presets", () => {
    const state = createDefaultMobLabState();
    const customPreset = JSON.parse(JSON.stringify(state.presets.better_cat_glb)) as ImportedMobPreset;
    const customPartId = customPreset.parts[0]?.id ?? "body";
    customPreset.id = "custom_tabby";
    customPreset.variantId = "tabby";

    const persistedState = {
      version: 4,
      activeMobId: customPreset.id,
      selectedPartByMobId: {
        [customPreset.id]: customPartId
      },
      presets: {
        [customPreset.id]: customPreset
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const loadedState = loadPersistedMobLabState();

    expect(loadedState.presets[customPreset.id].variantId).toBe("tabby");
  });
});
