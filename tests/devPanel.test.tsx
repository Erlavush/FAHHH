// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DevPanel } from "../src/app/components/DevPanel";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderDevPanel(overrides: Partial<Parameters<typeof DevPanel>[0]> = {}) {
  const onPlayerCoinsCommit = overrides.onPlayerCoinsCommit ?? vi.fn();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      createElement(DevPanel, {
        visible: true,
        buildModeEnabled: false,
        catalogOpen: false,
        gridSnapEnabled: true,
        buildSettingsCollapsed: true,
        playerStateCollapsed: false,
        playerCoordinatesCollapsed: true,
        cameraPropertiesCollapsed: true,
        worldSettingsCollapsed: true,
        lightingFxCollapsed: true,
        collisionDebugCollapsed: true,
        actionsCollapsed: true,
        playerCoins: 180,
        playerCoinsCommitMode: "change",
        playerCoinsSourceLabel: "Local sandbox live edit",
        playerInteractionLabel: "None",
        playerPosition: [0, 0, 0],
        cameraPosition: [0, 0, 0],
        cameraTarget: [0, 0, 0],
        worldTimeLabel: "12:00",
        useMinecraftTime: false,
        minecraftTimeHours: 12,
        timeLocked: false,
        lockedTimeHours: 12,
        sunEnabled: true,
        shadowsEnabled: true,
        fogEnabled: false,
        fogDensity: 0.02,
        ambientMultiplier: 1,
        sunIntensityMultiplier: 1,
        brightness: 1,
        saturation: 1,
        contrast: 1,
        showCollisionDebug: false,
        showPlayerCollider: false,
        showInteractionMarkers: false,
        onToggleBuildMode: vi.fn(),
        onToggleCatalog: vi.fn(),
        onToggleGridSnap: vi.fn(),
        onBuildSettingsCollapsedChange: vi.fn(),
        onPlayerStateCollapsedChange: vi.fn(),
        onPlayerCoordinatesCollapsedChange: vi.fn(),
        onCameraPropertiesCollapsedChange: vi.fn(),
        onWorldSettingsCollapsedChange: vi.fn(),
        onLightingFxCollapsedChange: vi.fn(),
        onCollisionDebugCollapsedChange: vi.fn(),
        onActionsCollapsedChange: vi.fn(),
        onPlayerCoinsCommit,
        onPlayerAxisCommit: vi.fn(),
        onCameraAxisCommit: vi.fn(),
        onApplyTransforms: vi.fn(),
        onResetCamera: vi.fn(),
        onResetSandbox: vi.fn(),
        onUseMinecraftTimeChange: vi.fn(),
        onMinecraftTimeHoursCommit: vi.fn(),
        onTimeLockedChange: vi.fn(),
        onLockedTimeHoursCommit: vi.fn(),
        onSyncLockedTime: vi.fn(),
        onSunEnabledChange: vi.fn(),
        onShadowsEnabledChange: vi.fn(),
        onFogEnabledChange: vi.fn(),
        onFogDensityCommit: vi.fn(),
        onAmbientMultiplierCommit: vi.fn(),
        onSunIntensityMultiplierCommit: vi.fn(),
        onBrightnessCommit: vi.fn(),
        onSaturationCommit: vi.fn(),
        onContrastCommit: vi.fn(),
        onShowCollisionDebugChange: vi.fn(),
        onShowPlayerColliderChange: vi.fn(),
        onShowInteractionMarkersChange: vi.fn(),
        ...overrides
      })
    );
  });

  return { onPlayerCoinsCommit };
}

function queryTextInput(): HTMLInputElement | null {
  return (container?.querySelector('input[type="text"]') ?? null) as HTMLInputElement | null;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, value);
}

describe("DevPanel coins editor", () => {
  beforeEach(() => {
    container = null;
    root = null;
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;

    if (container) {
      container.remove();
    }

    container = null;
    vi.restoreAllMocks();
  });

  it("commits coin changes immediately while typing in local sandbox mode", () => {
    const { onPlayerCoinsCommit } = renderDevPanel();
    const input = queryTextInput();

    expect(input).not.toBeNull();

    act(() => {
      setInputValue(input!, "245");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onPlayerCoinsCommit).toHaveBeenCalledWith(245);
    expect(container?.textContent).toContain("Local sandbox live edit");
  });

  it("commits the shared-room coin field on blur", () => {
    const onPlayerCoinsCommit = vi.fn();

    renderDevPanel({
      playerCoins: 320,
      playerCoinsCommitMode: "blur",
      playerCoinsSourceLabel: "Shared room debug edit",
      onPlayerCoinsCommit
    });
    const input = queryTextInput();

    expect(input?.readOnly).toBe(false);
    expect(container?.textContent).toContain("Shared room debug edit");

    act(() => {
      setInputValue(input!, "410");
      input!.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onPlayerCoinsCommit).not.toHaveBeenCalled();

    act(() => {
      input!.focus();
      input!.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });

    expect(onPlayerCoinsCommit).toHaveBeenCalledWith(410);
  });
});
