import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultMobLabState, loadPersistedMobLabState, type PersistedMobLabState } from "../src/lib/mobLabState";
import type { ImportedMobPreset } from "../src/lib/mobLab";

const STORAGE_KEY = "cozy-room-mob-lab";

describe("mobLabState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("drops removed built-in cat presets from persisted state", () => {
    const state = createDefaultMobLabState();
    const staleCatPreset = JSON.parse(JSON.stringify(state.presets.alexs_mobs_raccoon)) as ImportedMobPreset;
    staleCatPreset.id = "minecraft_native_cat_tabby";
    staleCatPreset.label = "Removed Cat Preset";

    const persistedState: PersistedMobLabState | Record<string, unknown> = {
      version: 4,
      activeMobId: staleCatPreset.id,
      selectedPartByMobId: {
        [staleCatPreset.id]: staleCatPreset.parts[0].id
      },
      presets: {
        [staleCatPreset.id]: staleCatPreset
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const loadedState = loadPersistedMobLabState();

    expect(loadedState.presets[staleCatPreset.id]).toBeUndefined();
    expect(loadedState.activeMobId).toBe("better_cats_v4_tabby");
  });

  it("keeps imported custom presets that are not part of the built-in library", () => {
    const state = createDefaultMobLabState();
    const customPreset = JSON.parse(JSON.stringify(state.presets.alexs_mobs_raccoon)) as ImportedMobPreset;
    customPreset.id = "custom_cat_test";
    customPreset.label = "Custom Cat Test";

    const persistedState = {
      version: 4,
      activeMobId: customPreset.id,
      selectedPartByMobId: {
        [customPreset.id]: customPreset.parts[0].id
      },
      presets: {
        [customPreset.id]: customPreset
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));

    const loadedState = loadPersistedMobLabState();

    expect(loadedState.presets[customPreset.id].label).toBe("Custom Cat Test");
  });
});
