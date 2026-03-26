// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRoomFurnitureEditor } from "../src/components/room-view/useRoomFurnitureEditor";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

function createOwnedFurnitureId(id: string): string {
  return `owned-${id}`;
}

function makePoster(
  id: string,
  position: [number, number, number]
): RoomFurniturePlacement {
  return {
    id,
    type: "poster",
    surface: "wall_back",
    position,
    rotationY: 0,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

type HookValue = ReturnType<typeof useRoomFurnitureEditor>;

type HarnessProps = {
  acquireEditLock?: (furnitureId: string) => Promise<boolean>;
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  initialFurniturePlacements: RoomFurniturePlacement[];
  localLockedFurnitureIds?: ReadonlySet<string>;
  onSharedEditConflict?: () => void;
  playerWorldPosition: [number, number, number];
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
  partnerLockedFurnitureIds?: ReadonlySet<string>;
  releaseEditLock?: (furnitureId: string) => Promise<void>;
  renewEditLock?: (furnitureId: string) => Promise<boolean>;
};

let latestHookValue: HookValue | null = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function HookHarness(props: HarnessProps) {
  latestHookValue = useRoomFurnitureEditor(props);
  return null;
}

describe("useRoomFurnitureEditor", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    latestHookValue = null;

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
  });

  it("keeps confirmed placements until the parent prop catches up", () => {
    const initialPlacements = [makePoster("poster-1", [0, 2, -4.83])];
    const snapshotSpy = vi.fn();
    const committedSpy = vi.fn();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const renderHarness = (placements: RoomFurniturePlacement[]) => {
      act(() => {
        root?.render(
          createElement(HookHarness, {
            buildModeEnabled: true,
            gridSnapEnabled: true,
            initialFurniturePlacements: placements,
            playerWorldPosition: [6, 0, 6],
            onFurnitureSnapshotChange: snapshotSpy,
            onCommittedFurnitureChange: committedSpy
          })
        );
      });
    };

    renderHarness(initialPlacements);

    expect(latestHookValue).not.toBeNull();

    act(() => {
      latestHookValue?.selectFurnitureForEditing("poster-1");
    });
    act(() => {
      latestHookValue?.updateFurnitureItem("poster-1", (item) => ({
        ...item,
        position: [1.2, 2, -4.83]
      }));
    });

    expect(latestHookValue?.furniture[0]?.position).toEqual([1.2, 2, -4.83]);

    act(() => {
      latestHookValue?.handleConfirmFurniturePlacement();
    });

    expect(committedSpy).toHaveBeenCalledTimes(1);
    expect(latestHookValue?.committedFurniture[0]?.position).toEqual([
      1.2,
      2,
      -4.83
    ]);
    expect(latestHookValue?.furniture[0]?.position).toEqual([1.2, 2, -4.83]);

    const savedPlacements = committedSpy.mock.calls[0]?.[0] as
      | RoomFurniturePlacement[]
      | undefined;

    expect(savedPlacements?.[0]?.position).toEqual([1.2, 2, -4.83]);

    renderHarness(savedPlacements ?? initialPlacements);

    expect(latestHookValue?.committedFurniture[0]?.position).toEqual([
      1.2,
      2,
      -4.83
    ]);
    expect(latestHookValue?.furniture[0]?.position).toEqual([1.2, 2, -4.83]);
  });

  it("different items remain editable concurrently", async () => {
    const initialPlacements = [
      makePoster("poster-1", [0, 2, -4.83]),
      makePoster("poster-2", [1.5, 2, -4.83])
    ];
    const acquireEditLock = vi.fn().mockResolvedValue(true);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        createElement(HookHarness, {
          acquireEditLock,
          buildModeEnabled: true,
          gridSnapEnabled: true,
          initialFurniturePlacements: initialPlacements,
          localLockedFurnitureIds: new Set(["poster-1"]),
          onCommittedFurnitureChange: vi.fn(),
          onFurnitureSnapshotChange: vi.fn(),
          partnerLockedFurnitureIds: new Set(["poster-2"]),
          playerWorldPosition: [6, 0, 6]
        })
      );
    });

    await act(async () => {
      await latestHookValue?.selectFurnitureForEditing("poster-1");
    });

    expect(acquireEditLock).toHaveBeenCalledWith("poster-1");
    expect(latestHookValue?.selectedFurnitureId).toBe("poster-1");
    expect(latestHookValue?.busyFurnitureId).toBeNull();
  });

  it("clears the busy item once the partner-held lock releases", async () => {
    const initialPlacements = [
      makePoster("poster-1", [0, 2, -4.83]),
      makePoster("poster-2", [1.5, 2, -4.83])
    ];
    const acquireEditLock = vi.fn().mockResolvedValue(true);
    const renderHarness = (
      partnerLockedFurnitureIds: ReadonlySet<string>,
      localLockedFurnitureIds: ReadonlySet<string>
    ) => {
      act(() => {
        root?.render(
          createElement(HookHarness, {
            acquireEditLock,
            buildModeEnabled: true,
            gridSnapEnabled: true,
            initialFurniturePlacements: initialPlacements,
            localLockedFurnitureIds,
            onCommittedFurnitureChange: vi.fn(),
            onFurnitureSnapshotChange: vi.fn(),
            partnerLockedFurnitureIds,
            playerWorldPosition: [6, 0, 6]
          })
        );
      });
    };

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    renderHarness(new Set(["poster-2"]), new Set());

    await act(async () => {
      await latestHookValue?.selectFurnitureForEditing("poster-2");
    });

    expect(latestHookValue?.selectedFurnitureId).toBeNull();
    expect(latestHookValue?.busyFurnitureId).toBe("poster-2");

    renderHarness(new Set(), new Set(["poster-2"]));

    await act(async () => {
      await latestHookValue?.selectFurnitureForEditing("poster-2");
    });

    expect(acquireEditLock).toHaveBeenCalledWith("poster-2");
    expect(latestHookValue?.busyFurnitureId).toBeNull();
    expect(latestHookValue?.selectedFurnitureId).toBe("poster-2");
  });
});
