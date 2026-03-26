import { beforeEach, describe, expect, it } from "vitest";
import {
  WORLD_SETTINGS_KEY,
  loadPersistedWorldSettings,
  savePersistedWorldSettings
} from "../src/lib/devWorldSettings";

describe("devWorldSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads shell view mode and developer workspace tab", () => {
    window.localStorage.setItem(
      WORLD_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        shellViewMode: "developer",
        developerWorkspaceTab: "session",
        playerCompanionCardExpanded: true
      })
    );

    expect(loadPersistedWorldSettings()).toMatchObject({
      version: 1,
      shellViewMode: "developer",
      developerWorkspaceTab: "session",
      playerCompanionCardExpanded: true
    });
  });

  it("drops invalid shell view mode and workspace values", () => {
    window.localStorage.setItem(
      WORLD_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        shellViewMode: "toolbox",
        developerWorkspaceTab: "preview",
        playerCompanionCardExpanded: "yes"
      })
    );

    expect(loadPersistedWorldSettings()).toMatchObject({
      version: 1,
      shellViewMode: undefined,
      developerWorkspaceTab: undefined,
      playerCompanionCardExpanded: undefined
    });
  });

  it("saves shell settings without dropping existing world settings", () => {
    savePersistedWorldSettings({
      buildModeEnabled: true,
      shellViewMode: "player",
      developerWorkspaceTab: "inventory"
    });

    expect(loadPersistedWorldSettings()).toMatchObject({
      version: 1,
      buildModeEnabled: true,
      shellViewMode: "player",
      developerWorkspaceTab: "inventory"
    });
  });
});
