import type { PlayerInteractionStatus } from "../types";

type SceneToolbarProps = {
  buildModeEnabled: boolean;
  catalogOpen: boolean;
  coinsLabel?: string;
  gridSnapEnabled: boolean;
  playerCoins: number;
  timeLocked: boolean;
  worldTimeLabel: string;
  previewStudioOpen: boolean;
  debugOpen: boolean;
  playerInteractionStatus: PlayerInteractionStatus;
  onToggleBuildMode: () => void;
  onToggleCatalog: () => void;
  onToggleGridSnap: () => void;
  onImportSkin: () => void;
  onTogglePreviewStudio: () => void;
  onResetCamera: () => void;
  onResetRoom: () => void;
  onStandRequest: () => void;
  onToggleDebug: () => void;
};

export function SceneToolbar({
  buildModeEnabled,
  catalogOpen,
  coinsLabel = "Coins",
  gridSnapEnabled,
  playerCoins,
  timeLocked,
  worldTimeLabel,
  previewStudioOpen,
  debugOpen,
  playerInteractionStatus,
  onToggleBuildMode,
  onToggleCatalog,
  onToggleGridSnap,
  onImportSkin,
  onTogglePreviewStudio,
  onResetCamera,
  onResetRoom,
  onStandRequest,
  onToggleDebug
}: SceneToolbarProps) {
  return (
    <div className="scene-toolbar">
      <button
        className={`camera-toggle${buildModeEnabled ? " camera-toggle--active" : ""}`}
        disabled={playerInteractionStatus !== null && !buildModeEnabled}
        onClick={onToggleBuildMode}
        type="button"
      >
        {buildModeEnabled ? "Build Mode: On" : "Build Mode: Off"}
      </button>
      <button
        className={`camera-toggle${catalogOpen ? " camera-toggle--active" : ""}`}
        disabled={playerInteractionStatus !== null}
        onClick={onToggleCatalog}
        type="button"
      >
        {catalogOpen ? "Inventory: On" : "Inventory: Off"}
      </button>
      <button
        className={`camera-toggle${gridSnapEnabled ? " camera-toggle--active" : ""}`}
        onClick={onToggleGridSnap}
        type="button"
      >
        {gridSnapEnabled ? "Grid Snap: On" : "Grid Snap: Off"}
      </button>
      <div className="camera-toggle camera-toggle--status">
        {coinsLabel}: {playerCoins}
      </div>
      <div className="camera-toggle camera-toggle--status">
        {timeLocked ? `Time Locked: ${worldTimeLabel}` : `Time: ${worldTimeLabel}`}
      </div>
      <button className="camera-toggle" onClick={onImportSkin} type="button">
        Import Minecraft Skin
      </button>
      <button
        className={`camera-toggle${previewStudioOpen ? " camera-toggle--active" : ""}`}
        onClick={onTogglePreviewStudio}
        type="button"
      >
        {previewStudioOpen ? "Preview Studio: On" : "Preview Studio"}
      </button>
      <button className="camera-toggle" onClick={onResetCamera} type="button">
        Reset Camera
      </button>
      <button className="camera-toggle" onClick={onResetRoom} type="button">
        Reset Room
      </button>
      {playerInteractionStatus ? (
        <button
          className="camera-toggle camera-toggle--active"
          onClick={onStandRequest}
          type="button"
        >
          {playerInteractionStatus.phase === "active"
            ? `Stand Up (${playerInteractionStatus.label})`
            : `Cancel ${playerInteractionStatus.label}`}
        </button>
      ) : null}
      <button
        className={`camera-toggle${debugOpen ? " camera-toggle--active" : ""}`}
        onClick={onToggleDebug}
        type="button"
      >
        {debugOpen ? "Dev Panel: On" : "Dev Panel: Off"}
      </button>
    </div>
  );
}
