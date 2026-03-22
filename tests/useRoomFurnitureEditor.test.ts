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
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  initialFurniturePlacements: RoomFurniturePlacement[];
  playerWorldPosition: [number, number, number];
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
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
});
