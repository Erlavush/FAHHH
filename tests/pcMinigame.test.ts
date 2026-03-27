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
      "pc_runner"
    ]);
    expect(getPcDeskRewardCoins("pc_snake", 12)).toBeGreaterThan(0);
    expect(getPcDeskRewardCoins("pc_block_stacker", 12)).toBeGreaterThan(
      getPcDeskRewardCoins("pc_snake", 12)
    );
    expect(getPcDeskRewardCoins("pc_runner", 12)).toBeGreaterThan(0);
  });

  it("launches Snake, Block Stacker, and Runner from the retro desktop shell", async () => {
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

    expect(queryButton("Snake")).not.toBeNull();
    expect(queryButton("Block Stacker")).not.toBeNull();
    expect(queryButton("Runner")).not.toBeNull();

    await act(async () => {
      queryButton("Snake")?.click();
    });
    expect(container?.textContent).toContain("SNAKE.EXE");

    await act(async () => {
      queryButton("Back to desktop")?.click();
      queryButton("Block Stacker")?.click();
    });
    expect(container?.textContent).toContain("STACKER.EXE");

    await act(async () => {
      queryButton("Back to desktop")?.click();
      queryButton("Runner")?.click();
    });
    expect(container?.textContent).toContain("RUNNER.EXE");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows paid and practice-only result states without blocking replay", async () => {
    const onComplete = vi.fn<(result: PcDeskRunResult) => void>();
    vi.spyOn(Math, "random").mockReturnValue(0.1);

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
          key: "paid-run",
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










