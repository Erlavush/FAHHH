import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from "react";
import type { PlayerActionDockAction } from "../../app/shellViewModel";

type PlayerActionDockProps = {
  actions: PlayerActionDockAction[];
  onAction: (id: PlayerActionDockAction["id"]) => void;
  statusLabel?: string;
  coins?: number;
  level?: number;
  togetherDays?: number;
  metricLabel?: string;
  editorVisible?: boolean;
};

const DOCK_PARTS = [
  { id: "frame", label: "Frame", resizable: false },
  { id: "titleLeft", label: "Title Left", resizable: true },
  { id: "titleRight", label: "Title Right", resizable: true },
  { id: "playerPortrait", label: "Player Portrait", resizable: true },
  { id: "playerLabel", label: "Player Label", resizable: true },
  { id: "kittyPortrait", label: "Kitty Portrait", resizable: true },
  { id: "kittyLabel", label: "Kitty Label", resizable: true },
  { id: "pupPortrait", label: "Pup Portrait", resizable: true },
  { id: "pupLabel", label: "Pup Label", resizable: true },
  { id: "levelIcon", label: "Level Icon", resizable: true },
  { id: "levelLabel", label: "Level Label", resizable: true },
  { id: "coinIcon", label: "Coin Icon", resizable: true },
  { id: "coinLabel", label: "Coin Label", resizable: true },
  { id: "statusBanner", label: "Mode Pill", resizable: true },
  { id: "togetherDays", label: "Day Label", resizable: true },
  { id: "buildIcon", label: "Build Icon", resizable: true },
  { id: "buildPlaque", label: "Build Plaque", resizable: true },
  { id: "inventoryIcon", label: "Inventory Icon", resizable: true },
  { id: "inventoryPlaque", label: "Inventory Plaque", resizable: true }
] as const;

type DockPartId = (typeof DOCK_PARTS)[number]["id"];
type DockPartConfig = (typeof DOCK_PARTS)[number];

type DockPartState = {
  x: number;
  y: number;
  scale: number;
  locked: boolean;
};

type DockLayout = Record<DockPartId, DockPartState>;

type InteractionState =
  | {
      kind: "drag";
      partId: DockPartId;
      pointerStartX: number;
      pointerStartY: number;
      originX: number;
      originY: number;
    }
  | {
      kind: "resize";
      partId: DockPartId;
      pointerStartX: number;
      pointerStartY: number;
      originScale: number;
    };

type EditableDockNodeProps = {
  children: ReactNode;
  className: string;
  editMode: boolean;
  label: string;
  partState: DockPartState;
  selected: boolean;
  resizable: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onResizePointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

const PRIMARY_ICON_BY_ACTION_ID: Partial<Record<PlayerActionDockAction["id"], string>> = {
  build: "/ui/hud/buildmode-icon.png",
  inventory: "/ui/hud/inventory-icon.png"
};

const HUD_LAYOUT_STORAGE_KEY = "player-hud-dock-layout-v2";
const HUD_DEFAULT_LAYOUT_STORAGE_KEY = "player-hud-dock-default-layout-v1";
const HUD_EDITOR_GRID_SIZE = 4;
const HUD_EDITOR_SCALE_STEP = 0.05;
const HUD_EDITOR_MIN_SCALE = 0.35;
const HUD_EDITOR_MAX_SCALE = 3;
const HUD_RESIZE_SENSITIVITY = 160;

const DOCK_PART_IDS = DOCK_PARTS.map((part) => part.id) as DockPartId[];
const DOCK_PART_META = Object.fromEntries(
  DOCK_PARTS.map((part) => [part.id, part])
) as Record<DockPartId, DockPartConfig>;

function getDefaultPartState(partId: DockPartId): DockPartState {
  return {
    x: 0,
    y: 0,
    scale: 1,
    locked: partId === "frame"
  };
}

const DEFAULT_DOCK_LAYOUT = DOCK_PART_IDS.reduce((nextLayout, partId) => {
  nextLayout[partId] = getDefaultPartState(partId);
  return nextLayout;
}, {} as DockLayout);

function getActionCaption(action: PlayerActionDockAction | undefined, fallback: string) {
  if (!action) {
    return fallback;
  }

  return action.label;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clampScale(value: number) {
  return Math.min(HUD_EDITOR_MAX_SCALE, Math.max(HUD_EDITOR_MIN_SCALE, value));
}

function snapToGrid(value: number) {
  return Math.round(value / HUD_EDITOR_GRID_SIZE) * HUD_EDITOR_GRID_SIZE;
}

function snapScale(value: number) {
  return Math.round(value / HUD_EDITOR_SCALE_STEP) * HUD_EDITOR_SCALE_STEP;
}

function normalizePartState(partId: DockPartId, value: unknown): DockPartState {
  const defaults = getDefaultPartState(partId);

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const candidate = value as Partial<DockPartState>;
  return {
    x: typeof candidate.x === "number" && Number.isFinite(candidate.x) ? candidate.x : defaults.x,
    y: typeof candidate.y === "number" && Number.isFinite(candidate.y) ? candidate.y : defaults.y,
    scale:
      typeof candidate.scale === "number" && Number.isFinite(candidate.scale)
        ? clampScale(candidate.scale)
        : defaults.scale,
    locked: typeof candidate.locked === "boolean" ? candidate.locked : defaults.locked
  };
}

function loadDockLayout(): DockLayout {
  if (!canUseLocalStorage()) {
    return DEFAULT_DOCK_LAYOUT;
  }

  try {
    const rawValue = window.localStorage.getItem(HUD_LAYOUT_STORAGE_KEY);
    const defaultRawValue = window.localStorage.getItem(HUD_DEFAULT_LAYOUT_STORAGE_KEY);

    if (rawValue && !defaultRawValue) {
      window.localStorage.setItem(HUD_DEFAULT_LAYOUT_STORAGE_KEY, rawValue);
    }

    const resolvedRawValue = rawValue ?? defaultRawValue;
    if (!resolvedRawValue) {
      return DEFAULT_DOCK_LAYOUT;
    }

    const parsedValue = JSON.parse(resolvedRawValue) as Partial<Record<DockPartId, unknown>>;
    return DOCK_PART_IDS.reduce((nextLayout, partId) => {
      nextLayout[partId] = normalizePartState(partId, parsedValue[partId]);
      return nextLayout;
    }, {} as DockLayout);
  } catch {
    return DEFAULT_DOCK_LAYOUT;
  }
}

function createDockTransformStyle(partState: DockPartState): CSSProperties {
  return {
    ["--dock-editor-x" as string]: `${partState.x}px`,
    ["--dock-editor-y" as string]: `${partState.y}px`,
    ["--dock-editor-scale" as string]: partState.scale.toString()
  } as CSSProperties;
}

function EditableDockNode({
  children,
  className,
  editMode,
  label,
  partState,
  selected,
  resizable,
  onPointerDown,
  onResizePointerDown
}: EditableDockNodeProps) {
  const editLabel = editMode ? `${label}${partState.locked ? " [locked]" : ""}` : undefined;
  const classNames = [
    className,
    "player-hud-dock__editable",
    editMode ? "player-hud-dock__editable--editing" : "",
    selected ? "player-hud-dock__editable--selected" : "",
    partState.locked ? "player-hud-dock__editable--locked" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      data-edit-label={editLabel}
      onPointerDown={editMode ? onPointerDown : undefined}
      style={createDockTransformStyle(partState)}
    >
      {children}
      {editMode && selected && resizable && !partState.locked ? (
        <button
          aria-label={`Resize ${label}`}
          className="player-hud-dock__resize-handle"
          onPointerDown={onResizePointerDown}
          type="button"
        />
      ) : null}
    </div>
  );
}

export function PlayerActionDock({
  actions,
  onAction,
  statusLabel = "Room mode",
  coins = 0,
  level = 1,
  togetherDays = 0,
  metricLabel,
  editorVisible = false
}: PlayerActionDockProps) {
  const buildAction = actions.find((action) => action.id === "build");
  const inventoryAction = actions.find((action) => action.id === "inventory");
  const otherActions = actions.filter(
    (action) => action.id !== "build" && action.id !== "inventory"
  );

  const [editMode, setEditMode] = useState(false);
  const effectiveEditMode = editorVisible && editMode;
  const [selectedPartId, setSelectedPartId] = useState<DockPartId>("frame");
  const [layout, setLayout] = useState<DockLayout>(() => loadDockLayout());
  const [interactionState, setInteractionState] = useState<InteractionState | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseLocalStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(HUD_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore temporary HUD editor persistence failures.
    }
  }, [layout]);

  useEffect(() => {
    if (!interactionState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (interactionState.kind === "drag") {
        const deltaX = event.clientX - interactionState.pointerStartX;
        const deltaY = event.clientY - interactionState.pointerStartY;

        setLayout((currentLayout) => ({
          ...currentLayout,
          [interactionState.partId]: {
            ...currentLayout[interactionState.partId],
            x: snapToGrid(interactionState.originX + deltaX),
            y: snapToGrid(interactionState.originY + deltaY)
          }
        }));
        return;
      }

      const deltaX = event.clientX - interactionState.pointerStartX;
      const deltaY = event.clientY - interactionState.pointerStartY;
      const scaleDelta = Math.max(deltaX, deltaY) / HUD_RESIZE_SENSITIVITY;

      setLayout((currentLayout) => ({
        ...currentLayout,
        [interactionState.partId]: {
          ...currentLayout[interactionState.partId],
          scale: clampScale(snapScale(interactionState.originScale + scaleDelta))
        }
      }));
    };

    const handlePointerUp = () => {
      setInteractionState(null);
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interactionState]);

  useEffect(() => {
    if (!copyStatus) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyStatus(null), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const layoutJson = useMemo(() => JSON.stringify(layout, null, 2), [layout]);
  const selectedPartState = layout[selectedPartId];
  const selectedPart = DOCK_PART_META[selectedPartId];

  const renderEditablePart = (partId: DockPartId, className: string, children: ReactNode) => (
    <EditableDockNode
      className={className}
      editMode={effectiveEditMode}
      key={partId}
      label={DOCK_PART_META[partId].label}
      onPointerDown={startDraggingPart(partId)}
      onResizePointerDown={startResizingPart(partId)}
      partState={layout[partId]}
      resizable={DOCK_PART_META[partId].resizable}
      selected={selectedPartId === partId}
    >
      {children}
    </EditableDockNode>
  );

  function startDraggingPart(partId: DockPartId) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!effectiveEditMode || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setSelectedPartId(partId);

      const currentPartState = layout[partId];
      if (currentPartState.locked) {
        return;
      }

      setInteractionState({
        kind: "drag",
        partId,
        pointerStartX: event.clientX,
        pointerStartY: event.clientY,
        originX: currentPartState.x,
        originY: currentPartState.y
      });
    };
  }

  function startResizingPart(partId: DockPartId) {
    return (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!effectiveEditMode || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setSelectedPartId(partId);

      const currentPartState = layout[partId];
      if (currentPartState.locked || !DOCK_PART_META[partId].resizable) {
        return;
      }

      setInteractionState({
        kind: "resize",
        partId,
        pointerStartX: event.clientX,
        pointerStartY: event.clientY,
        originScale: currentPartState.scale
      });
    };
  }

  const handleResetLayout = () => {
    setLayout(DEFAULT_DOCK_LAYOUT);
    setInteractionState(null);
    setSelectedPartId("frame");
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(HUD_LAYOUT_STORAGE_KEY);
    }
  };

  const handleResetSelectedPart = () => {
    setInteractionState(null);
    setLayout((currentLayout) => ({
      ...currentLayout,
      [selectedPartId]: getDefaultPartState(selectedPartId)
    }));
  };

  const handleToggleSelectedLock = () => {
    setInteractionState(null);
    setLayout((currentLayout) => ({
      ...currentLayout,
      [selectedPartId]: {
        ...currentLayout[selectedPartId],
        locked: !currentLayout[selectedPartId].locked
      }
    }));
  };

  const handleCopyLayout = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyStatus("Clipboard unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(layoutJson);
      setCopyStatus("Layout copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleDockAction = (actionId: PlayerActionDockAction["id"] | undefined) => () => {
    if (!actionId || effectiveEditMode) {
      return;
    }

    onAction(actionId);
  };

  const handleDockContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleToggleEditMode = () => {
    if (!editorVisible) {
      return;
    }

    setInteractionState(null);
    setEditMode((current) => !current);
  };

  return (
    <section
      className={`player-hud-dock${effectiveEditMode ? " player-hud-dock--edit-mode" : ""}`}
      aria-label="HUD primary actions"
    >
      <div className="player-hud-dock__stage">
        {editorVisible ? (
          <div className="player-hud-dock__editor-toolbar">
            <button
              className="player-hud-dock__editor-button"
              onClick={handleToggleEditMode}
              type="button"
            >
              {effectiveEditMode ? "Done HUD" : "Edit HUD"}
            </button>
            {effectiveEditMode ? (
              <>
                <label className="player-hud-dock__editor-select">
                  <span className="player-hud-dock__editor-select-label">Piece</span>
                  <select
                    className="player-hud-dock__editor-select-control"
                    onChange={(event) => setSelectedPartId(event.target.value as DockPartId)}
                    value={selectedPartId}
                  >
                    {DOCK_PARTS.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="player-hud-dock__editor-button player-hud-dock__editor-button--secondary"
                  onClick={handleToggleSelectedLock}
                  type="button"
                >
                  {selectedPartState.locked ? "Unlock Piece" : "Lock Piece"}
                </button>
                <button
                  className="player-hud-dock__editor-button player-hud-dock__editor-button--secondary"
                  onClick={handleResetSelectedPart}
                  type="button"
                >
                  Reset Piece
                </button>
                <button
                  className="player-hud-dock__editor-button player-hud-dock__editor-button--secondary"
                  onClick={handleResetLayout}
                  type="button"
                >
                  Reset Layout
                </button>
                <button
                  className="player-hud-dock__editor-button player-hud-dock__editor-button--secondary"
                  onClick={handleCopyLayout}
                  type="button"
                >
                  Copy Layout JSON
                </button>
                <span className="player-hud-dock__editor-hint">
                  {selectedPart.label}: {Math.round(selectedPartState.scale * 100)}%
                  {selectedPartState.locked ? " locked." : "."} Drag to move. Drag the round handle to resize.
                  Snap: {HUD_EDITOR_GRID_SIZE}px / {Math.round(HUD_EDITOR_SCALE_STEP * 100)}%.{copyStatus ? ` ${copyStatus}` : ""}
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {renderEditablePart(
          "frame",
          "player-hud-dock__frame-wrap",
          <div className="player-hud-dock__center-shell">
            <img
              alt=""
              aria-hidden="true"
              className="player-hud-dock__center-image"
              src="/ui/hud/container-center.png"
            />

            {renderEditablePart(
              "titleLeft",
              "player-hud-dock__piece player-hud-dock__piece--title-left",
              <div className="player-hud-dock__title">Character &amp; Pet Info</div>
            )}

            {renderEditablePart(
              "titleRight",
              "player-hud-dock__piece player-hud-dock__piece--title-right",
              <div className="player-hud-dock__title">Player Stats</div>
            )}







            {renderEditablePart(
              "levelIcon",
              "player-hud-dock__piece player-hud-dock__piece--level-icon",
              <img
                alt=""
                aria-hidden="true"
                className="player-hud-dock__stat-icon player-hud-dock__stat-icon--level"
                src="/ui/hud/level-icon.png"
              />
            )}

            {renderEditablePart(
              "levelLabel",
              "player-hud-dock__piece player-hud-dock__piece--level-label",
              <strong className="player-hud-dock__stat-label">Lv. {level}</strong>
            )}

            {renderEditablePart(
              "coinIcon",
              "player-hud-dock__piece player-hud-dock__piece--coin-icon",
              <img
                alt=""
                aria-hidden="true"
                className="player-hud-dock__stat-icon player-hud-dock__stat-icon--coin"
                src="/ui/hud/coin-icon.png"
              />
            )}

            {renderEditablePart(
              "coinLabel",
              "player-hud-dock__piece player-hud-dock__piece--coin-label",
              <strong className="player-hud-dock__stat-label player-hud-dock__stat-label--coins">
                {coins.toLocaleString()} Gold
              </strong>
            )}

            {renderEditablePart(
              "statusBanner",
              "player-hud-dock__piece-center player-hud-dock__piece-center--status",
              <div className="player-hud-dock__status-banner">{statusLabel}</div>
            )}

            {renderEditablePart(
              "togetherDays",
              "player-hud-dock__piece-center player-hud-dock__piece-center--days",
              <div className="player-hud-dock__together-days">{metricLabel ?? `Day ${togetherDays}`}</div>
            )}
          </div>
        )}

        {buildAction
          ? renderEditablePart(
              "buildIcon",
              "player-hud-dock__stage-piece player-hud-dock__stage-piece--build-icon",
              <button
                className="player-hud-dock__action-reset player-hud-dock__action-reset--icon"
                onClick={handleDockAction(buildAction.id)}
                onContextMenu={handleDockContextMenu}
                type="button"
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="player-hud-dock__side-button-icon player-hud-dock__side-button-icon--build"
                  src={PRIMARY_ICON_BY_ACTION_ID[buildAction.id]}
                />
              </button>
            )
          : null}

        {buildAction
          ? renderEditablePart(
              "buildPlaque",
              "player-hud-dock__stage-piece player-hud-dock__stage-piece--build-plaque",
              <button
                aria-pressed={buildAction.isActive}
                className={`player-hud-dock__action-reset player-hud-dock__side-button-plaque player-hud-dock__side-button-plaque--build${buildAction.isActive ? " player-hud-dock__side-button-plaque--active" : ""}`}
                onClick={handleDockAction(buildAction.id)}
                onContextMenu={handleDockContextMenu}
                type="button"
              >
                {getActionCaption(buildAction, "Enter Build Mode")}
              </button>
            )
          : null}

        {inventoryAction
          ? renderEditablePart(
              "inventoryIcon",
              "player-hud-dock__stage-piece player-hud-dock__stage-piece--inventory-icon",
              <button
                className="player-hud-dock__action-reset player-hud-dock__action-reset--icon"
                onClick={handleDockAction(inventoryAction.id)}
                onContextMenu={handleDockContextMenu}
                type="button"
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="player-hud-dock__side-button-icon player-hud-dock__side-button-icon--inventory"
                  src={PRIMARY_ICON_BY_ACTION_ID[inventoryAction.id]}
                />
              </button>
            )
          : null}

        {inventoryAction
          ? renderEditablePart(
              "inventoryPlaque",
              "player-hud-dock__stage-piece player-hud-dock__stage-piece--inventory-plaque",
              <button
                aria-pressed={inventoryAction.isActive}
                className={`player-hud-dock__action-reset player-hud-dock__side-button-plaque player-hud-dock__side-button-plaque--inventory${inventoryAction.isActive ? " player-hud-dock__side-button-plaque--active" : ""}`}
                onClick={handleDockAction(inventoryAction.id)}
                onContextMenu={handleDockContextMenu}
                type="button"
              >
                {getActionCaption(inventoryAction, "Open Inventory")}
              </button>
            )
          : null}
      </div>

      {otherActions.length > 0 ? (
        <div className="player-hud-dock__secondary" aria-label="Additional actions">
          {otherActions.map((action) => (
            <button
              key={action.id}
              className={`player-hud-dock__secondary-btn player-hud-dock__secondary-btn--${action.tone}`}
              onClick={() => onAction(action.id)}
              onContextMenu={handleDockContextMenu}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}











