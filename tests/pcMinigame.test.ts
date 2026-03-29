import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PC_MINIGAME_SESSION_MS,
  createDefaultPcDeskProgress,
  getPcDeskAppDefinitions,
  getPcDeskRewardCoins,
  type PcDeskRunResult
} from "../src/lib/pcMinigame";
import { PcMinigameOverlay } from "../src/components/PcMinigameOverlay";

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function queryButton(label: string): HTMLButtonElement | null {
  return Array.from(container?.querySelectorAll("button") ?? []).find(
    (button) => button.textContent?.includes(label)
  ) as HTMLButtonElement | null;
}

describe("pc desk minigame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns the three retro desk app ids", () => {
    expect(getPcDeskAppDefinitions().map((definition) => definition.id)).toEqual([
      "pc_snake",
      "pc_block_stacker",
      "pc_pacman"
    ]);
    expect(getPcDeskRewardCoins("pc_snake", 12)).toBeGreaterThan(0);
    expect(getPcDeskRewardCoins("pc_block_stacker", 12)).toBeGreaterThan(
      getPcDeskRewardCoins("pc_snake", 12)
    );
    expect(getPcDeskRewardCoins("pc_pacman", 180)).toBeGreaterThan(0);
  });

  it("launches distinct Snake, Block Stacker, and Pacman boards from the retro desktop shell", async () => {
    const onComplete = vi.fn<(result: PcDeskRunResult) => void>();

    await act(async () => {
      root?.render(
        createElement(PcMinigameOverlay, {
          currentCoins: 12,
          onComplete,
          onExit: vi.fn(),
          progress: createDefaultPcDeskProgress()
        })
      );
    });

    await act(async () => {
      queryButton("Snake")?.click();
    });
    await act(async () => {
      queryButton("Run app")?.click();
    });
    expect(container?.querySelector('[aria-label="Snake grid"]')).not.toBeNull();
    expect(queryButton("Up")).not.toBeNull();

    await act(async () => {
      queryButton("Back to desktop")?.click();
    });
    await act(async () => {
      queryButton("Block Stacker")?.click();
    });
    await act(async () => {
      queryButton("Run app")?.click();
    });
    expect(container?.querySelector('[aria-label="Block Stacker board"]')).not.toBeNull();
    expect(queryButton("Drop block")).not.toBeNull();

    await act(async () => {
      queryButton("Back to desktop")?.click();
    });
    await act(async () => {
      queryButton("Pacman")?.click();
    });
    await act(async () => {
      queryButton("Run app")?.click();
    });
    expect(container?.querySelector('[aria-label="Pacman maze"]')).not.toBeNull();
    expect(queryButton("Up")).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("lets block stacker score from a timed drop instead of the old click-target flow", async () => {
    await act(async () => {
      root?.render(
        createElement(PcMinigameOverlay, {
          currentCoins: 12,
          onComplete: vi.fn(),
          onExit: vi.fn(),
          progress: createDefaultPcDeskProgress()
        })
      );
    });

    await act(async () => {
      queryButton("Block Stacker")?.click();
    });
    await act(async () => {
      queryButton("Run app")?.click();
    });
    await act(async () => {
      queryButton("Drop block")?.click();
    });

    expect(container?.textContent).toContain("Score 4");
    expect(container?.querySelectorAll(".pc-minigame__target").length).toBe(0);
  });

  it("shows paid and practice-only result states without blocking replay", async () => {
    const onComplete = vi.fn<(result: PcDeskRunResult) => void>();

    await act(async () => {
      root?.render(
        createElement(PcMinigameOverlay, {
          key: "paid-run",
          currentCoins: 18,
          onComplete,
          onExit: vi.fn(),
          progress: createDefaultPcDeskProgress(),
          paidTodayByActivityId: {
            pc_snake: false
          }
        })
      );
    });

    await act(async () => {
      queryButton("Snake")?.click();
    });

    await act(async () => {
      queryButton("Run app")?.click();
      vi.advanceTimersByTime(PC_MINIGAME_SESSION_MS + 600);
    });

    expect(container?.textContent).toContain("Paid today");
    expect(queryButton("Play again")).not.toBeNull();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        activityId: "pc_snake"
      })
    );

    await act(async () => {
      root?.unmount();
    });
    root = createRoot(container!);

    await act(async () => {
      root?.render(
        createElement(PcMinigameOverlay, {
          key: "practice-run",
          currentCoins: 18,
          onComplete,
          onExit: vi.fn(),
          progress: createDefaultPcDeskProgress(),
          paidTodayByActivityId: {
            pc_snake: true
          }
        })
      );
    });

    await act(async () => {
      queryButton("Snake")?.click();
    });

    await act(async () => {
      queryButton("Run app")?.click();
      vi.advanceTimersByTime(PC_MINIGAME_SESSION_MS + 600);
    });

    expect(container?.textContent).toContain("Practice run only");
    expect(queryButton("Play again")).not.toBeNull();
  });
});
