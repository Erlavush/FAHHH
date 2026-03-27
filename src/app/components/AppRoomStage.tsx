import { Suspense, lazy, type ReactNode } from "react";
import type { DeveloperWorkspaceTab } from "../types";

type RoomViewProps = Parameters<typeof import("../../components/RoomView").RoomView>[0];
type FurniturePreviewStudioProps = Parameters<
  typeof import("../../components/FurniturePreviewStudio").FurniturePreviewStudio
>[0];

const RoomView = lazy(async () => {
  const module = await import("../../components/RoomView");
  return { default: module.RoomView };
});

const FurniturePreviewStudio = lazy(async () => {
  const module = await import("../../components/FurniturePreviewStudio");
  return { default: module.FurniturePreviewStudio };
});

interface AppRoomStageProps {
  inventoryPanelNode: ReactNode;
  previewStudioProps: FurniturePreviewStudioProps;
  roomViewProps: RoomViewProps;
  workspaceTab?: DeveloperWorkspaceTab;
}

export function AppRoomStage({
  inventoryPanelNode,
  previewStudioProps,
  roomViewProps,
  workspaceTab = "room"
}: AppRoomStageProps) {
  const roomStageNode = (
    <Suspense fallback={<div className="canvas-fallback">Loading scene...</div>}>
      <RoomView {...roomViewProps} />
    </Suspense>
  );

  if (workspaceTab === "inventory") {
    return <div className="developer-workspace-shell__panel-stage">{inventoryPanelNode}</div>;
  }

  if (workspaceTab === "preview_studio" || workspaceTab === "mob_lab") {
    return (
      <div className="developer-workspace-shell__panel-stage">
        <Suspense fallback={<div className="preview-studio preview-studio--loading">Loading preview studio...</div>}>
          <FurniturePreviewStudio {...previewStudioProps} />
        </Suspense>
      </div>
    );
  }

  return roomStageNode;
}