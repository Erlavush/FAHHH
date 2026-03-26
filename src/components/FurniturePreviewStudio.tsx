import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { ChairModel } from "./ChairModel";
import { FloorLampModel } from "./FloorLampModel";
import { FridgeModel } from "./FridgeModel";
import { OfficeChairModel, OfficeDeskModel, OfficeWardrobeModel } from "./OfficePackModels";
import { PosterModel } from "./PosterModel";
import { SmallTableModel } from "./SmallTableModel";
import { WallWindowModel } from "./WallWindowModel";
import {
  BedModel,
  DeskModel,
  RugModel,
  WallFrameModel
} from "./StarterFurnitureModels";
import { BookStackModel, VaseModel } from "./SurfaceDecorModels";
import {
  getFurnitureDefinition,
  type FurnitureCatalogCategory,
  type FurnitureDefinition,
  type FurnitureType
} from "../lib/furnitureRegistry";
import {
  DEFAULT_IMPORTED_MOB_PRESETS,
  DEFAULT_MOB_LAB_MOB_ID,
  cloneMobPreset,
  type ImportedMobPreset,
  type MobIdleAnimationSettings,
  type MobLocomotionSettings,
  type MobPreviewMode,
  type MobWalkAnimationSettings
} from "../lib/mobLab";
import {
  loadPersistedMobLabState,
  savePersistedMobLabState,
  type PersistedMobLabState
} from "../lib/mobLabState";
import type { PreviewStudioMode } from "../app/types";

const MobLabEditorPanel = lazy(async () => {
  const module = await import("./mob-lab/MobLabEditorPanel");
  return { default: module.MobLabEditorPanel };
});

const MobLabStage = lazy(async () => {
  const module = await import("./mob-lab/MobLabStage");
  return { default: module.MobLabStage };
});

type PreviewBackdropMode = "green" | "black" | "white";

type FurniturePreviewStudioProps = {
  catalogSections: Array<[FurnitureCatalogCategory, FurnitureDefinition[]]>;
  mode: PreviewStudioMode;
  presentation?: "overlay" | "workspace";
  selectedType: FurnitureType;
  selectedMobId: string;
  onModeChange: (mode: PreviewStudioMode) => void;
  onSelectTypeChange: (type: FurnitureType) => void;
  onSelectMobChange: (mobId: string) => void;
  onClose: () => void;
};

const PREVIEW_BACKDROP_OPTIONS: Array<{ mode: PreviewBackdropMode; label: string }> = [
  { mode: "green", label: "Green" },
  { mode: "black", label: "Black" },
  { mode: "white", label: "White" }
];

const ISOMETRIC_CAMERA_POSITION: [number, number, number] = [10, 10, 10];

const PREVIEW_MODEL_FRAMES: Record<
  FurnitureType,
  {
    width: number;
    height: number;
    depth: number;
    targetY: number;
  }
> = {
  bed: { width: 2.82, height: 1.18, depth: 3.82, targetY: 0.8 },
  desk: { width: 3, height: 1.52, depth: 1, targetY: 0.74 },
  chair: { width: 1, height: 1.18, depth: 1, targetY: 0.64 },
  table: { width: 1, height: 0.84, depth: 1, targetY: 0.52 },
  fridge: { width: 0.92, height: 2.1, depth: 0.92, targetY: 1.02 },
  wardrobe: { width: 1.42, height: 2.35, depth: 0.82, targetY: 1.14 },
  office_desk: { width: 2.85, height: 1.45, depth: 0.95, targetY: 0.72 },
  office_chair: { width: 0.92, height: 1.18, depth: 0.92, targetY: 0.66 },
  floor_lamp: { width: 0.78, height: 2.12, depth: 0.78, targetY: 0.94 },
  window: { width: 1.82, height: 2.18, depth: 0.38, targetY: 1.02 },
  vase: { width: 0.36, height: 0.84, depth: 0.36, targetY: 0.38 },
  books: { width: 0.58, height: 0.32, depth: 0.38, targetY: 0.16 },
  poster: { width: 1.94, height: 1.54, depth: 0.06, targetY: 0 },
  wall_frame: { width: 1.46, height: 1.1, depth: 0.06, targetY: 0 },
  rug: { width: 3.8, height: 0.06, depth: 2.6, targetY: 0.02 }
};

function getPreviewFileName(type: FurnitureType): string {
  return `${type.replace(/_/g, "-")}.png`;
}

function getProjectedPreviewFrame(type: FurnitureType) {
  const frame = PREVIEW_MODEL_FRAMES[type];

  return {
    targetY: frame.targetY,
    projectedWidth: (frame.width + frame.depth) / Math.SQRT2,
    projectedHeight: (frame.width + frame.depth + frame.height * 2) / Math.sqrt(6)
  };
}

function getPreviewBackdropPalette(mode: PreviewBackdropMode) {
  switch (mode) {
    case "green":
      return {
        background: "#1ec24b",
        floor: "#1ec24b",
        wall: "#1ec24b",
        ambientIntensity: 1.08,
        fillIntensity: 0.42
      };
    case "white":
      return {
        background: "#f7f9fd",
        floor: "#ffffff",
        wall: "#ffffff",
        ambientIntensity: 1.1,
        fillIntensity: 0.5
      };
    case "black":
    default:
      return {
        background: "#0e131b",
        floor: "#10151d",
        wall: "#10151d",
        ambientIntensity: 1.12,
        fillIntensity: 0.52
      };
  }
}

function renderPreviewFurnitureModel(type: FurnitureType) {
  const commonProps = {
    position: [0, 0, 0] as [number, number, number],
    rotationY: 0,
    shadowsEnabled: false,
    selected: false,
    hovered: false,
    interactionHovered: false,
    blocked: false
  };
  const definition = getFurnitureDefinition(type);

  switch (definition.modelKey) {
    case "bed":
      return <BedModel {...commonProps} />;
    case "desk":
      return <DeskModel {...commonProps} />;
    case "chair":
      return <ChairModel {...commonProps} />;
    case "small_table":
      return <SmallTableModel {...commonProps} />;
    case "fridge":
      return <FridgeModel {...commonProps} />;
    case "wardrobe":
      return <OfficeWardrobeModel {...commonProps} />;
    case "office_desk":
      return <OfficeDeskModel {...commonProps} />;
    case "office_chair":
      return <OfficeChairModel {...commonProps} />;
    case "floor_lamp":
      return <FloorLampModel {...commonProps} nightFactor={1} />;
    case "window":
      return <WallWindowModel {...commonProps} daylightAmount={1} />;
    case "vase":
      return <VaseModel {...commonProps} />;
    case "books":
      return <BookStackModel {...commonProps} />;
    case "poster":
      return <PosterModel {...commonProps} />;
    case "wall_frame":
      return <WallFrameModel {...commonProps} />;
    case "rug":
      return <RugModel {...commonProps} />;
    default:
      return null;
  }
}

function PreviewStudioScene({
  selectedType,
  backdropMode
}: {
  selectedType: FurnitureType;
  backdropMode: PreviewBackdropMode;
}) {
  const { size } = useThree();
  const definition = getFurnitureDefinition(selectedType);
  const projectedFrame = useMemo(() => getProjectedPreviewFrame(selectedType), [selectedType]);
  const cameraZoom = useMemo(() => {
    const widthFit = (size.width * 0.56) / projectedFrame.projectedWidth;
    const heightFit = (size.height * 0.62) / projectedFrame.projectedHeight;

    return Math.max(48, Math.min(widthFit, heightFit));
  }, [projectedFrame.projectedHeight, projectedFrame.projectedWidth, size.height, size.width]);
  const showWallBackdrop = definition.surface === "wall";
  const showGroundPlane = definition.surface !== "wall";
  const backdrop = useMemo(() => getPreviewBackdropPalette(backdropMode), [backdropMode]);

  return (
    <>
      <color attach="background" args={[backdrop.background]} />
      <OrthographicCamera
        makeDefault
        far={120}
        near={0.1}
        position={ISOMETRIC_CAMERA_POSITION}
        zoom={cameraZoom}
        onUpdate={(camera) => {
          camera.lookAt(0, projectedFrame.targetY, 0);
          camera.updateProjectionMatrix();
        }}
      />
      <ambientLight intensity={backdrop.ambientIntensity} />
      <directionalLight color="#ffd7ae" intensity={2.2} position={[5.6, 7.4, 5.4]} />
      <directionalLight color="#89aee6" intensity={backdrop.fillIntensity} position={[-4.2, 3.1, -4.8]} />

      {showGroundPlane ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.014, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial color={backdrop.floor} metalness={0.02} roughness={1} />
        </mesh>
      ) : null}

      {showWallBackdrop ? (
        <mesh position={[0, projectedFrame.targetY, -0.22]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color={backdrop.wall} metalness={0.02} roughness={1} />
        </mesh>
      ) : null}

      <Suspense fallback={null}>
        <group rotation={[0, 0, 0]}>{renderPreviewFurnitureModel(selectedType)}</group>
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        makeDefault
        maxPolarAngle={Math.PI / 2.08}
        minPolarAngle={Math.PI / 5.4}
        target={[0, projectedFrame.targetY, 0]}
      />
    </>
  );
}

function FurniturePreviewStage({
  selectedType,
  stageKey,
  backdropMode
}: {
  selectedType: FurnitureType;
  stageKey: string;
  backdropMode: PreviewBackdropMode;
}) {
  return (
    <Canvas key={stageKey} dpr={[1, 1.6]}>
      <PreviewStudioScene backdropMode={backdropMode} selectedType={selectedType} />
    </Canvas>
  );
}

function tryParseImportedMobPreset(rawText: string): ImportedMobPreset | null {
  try {
    const parsedValue = JSON.parse(rawText) as unknown;

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("id" in parsedValue) ||
      typeof parsedValue.id !== "string" ||
      !("label" in parsedValue) ||
      typeof parsedValue.label !== "string" ||
      !("parts" in parsedValue) ||
      !Array.isArray(parsedValue.parts) ||
      !("textureSrc" in parsedValue) ||
      typeof parsedValue.textureSrc !== "string"
    ) {
      return null;
    }

    return cloneMobPreset(parsedValue as ImportedMobPreset);
  } catch {
    return null;
  }
}

export function FurniturePreviewStudio({
  catalogSections,
  mode,
  presentation = "overlay",
  selectedType,
  selectedMobId,
  onModeChange,
  onSelectTypeChange,
  onSelectMobChange,
  onClose
}: FurniturePreviewStudioProps) {
  const [stageResetToken, setStageResetToken] = useState(0);
  const [backdropMode, setBackdropMode] = useState<PreviewBackdropMode>("green");
  const [mobLabState, setMobLabState] = useState<PersistedMobLabState>(() => loadPersistedMobLabState());
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const selectedEntry = getFurnitureDefinition(selectedType);
  const availableMobPresets = useMemo(
    () => Object.values(mobLabState.presets).sort((left, right) => left.label.localeCompare(right.label)),
    [mobLabState.presets]
  );
  const activeMobId = selectedMobId in mobLabState.presets
    ? selectedMobId
    : availableMobPresets[0]?.id ?? DEFAULT_MOB_LAB_MOB_ID;
  const activeMobPreset = mobLabState.presets[activeMobId] ?? DEFAULT_IMPORTED_MOB_PRESETS[DEFAULT_MOB_LAB_MOB_ID];
  const selectedPartId = mobLabState.selectedPartByMobId[activeMobId] ?? activeMobPreset.parts[0]?.id ?? "body";
  const stageKey =
    mode === "furniture"
      ? `${mode}-${selectedType}-${backdropMode}-${stageResetToken}`
      : `${mode}-${activeMobId}-${stageResetToken}`;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setStageResetToken(0);
  }, [activeMobId, backdropMode, mode, selectedType]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      savePersistedMobLabState(mobLabState);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mobLabState]);

  useEffect(() => {
    if (activeMobId !== selectedMobId) {
      onSelectMobChange(activeMobId);
    }
  }, [activeMobId, onSelectMobChange, selectedMobId]);

  useEffect(() => {
    if (!activeMobPreset.parts.some((part) => part.id === selectedPartId)) {
      setMobLabState((currentState) => ({
        ...currentState,
        selectedPartByMobId: {
          ...currentState.selectedPartByMobId,
          [activeMobId]: activeMobPreset.parts[0]?.id ?? "body"
        }
      }));
    }
  }, [activeMobId, activeMobPreset.parts, selectedPartId]);

  function updateActiveMobPreset(updater: (preset: ImportedMobPreset) => ImportedMobPreset): void {
    setMobLabState((currentState) => ({
      ...currentState,
      presets: {
        ...currentState.presets,
        [activeMobId]: updater(currentState.presets[activeMobId] ?? activeMobPreset)
      }
    }));
  }

  function handleSelectPart(partId: string): void {
    setMobLabState((currentState) => ({
      ...currentState,
      selectedPartByMobId: {
        ...currentState.selectedPartByMobId,
        [activeMobId]: partId
      }
    }));
  }

  function handleUpdatePart(
    partId: string,
    section: "position" | "rotation" | "scale",
    axis: 0 | 1 | 2,
    value: number
  ): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      parts: preset.parts.map((part) => {
        if (part.id !== partId) {
          return part;
        }

        const nextValues = [...part.transform[section]] as [number, number, number];
        nextValues[axis] = Number.isFinite(value) ? value : 0;

        return {
          ...part,
          transform: {
            ...part.transform,
            [section]: nextValues
          }
        };
      })
    }));
  }

  function handleUpdateIdle(field: keyof MobIdleAnimationSettings, value: number): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      animation: {
        ...preset.animation,
        idle: {
          ...preset.animation.idle,
          [field]: Number.isFinite(value) ? value : 0
        }
      }
    }));
  }

  function handleUpdateWalk(field: keyof MobWalkAnimationSettings, value: number): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      animation: {
        ...preset.animation,
        walk: {
          ...preset.animation.walk,
          [field]: Number.isFinite(value) ? value : 0
        }
      }
    }));
  }

  function handleUpdateLocomotion<K extends keyof MobLocomotionSettings>(
    field: K,
    value: MobLocomotionSettings[K]
  ): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      locomotion: {
        ...preset.locomotion,
        [field]: value
      }
    }));
  }

  function handleUpdatePhysicsNumber(field: "groundOffset", value: number): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      physics: {
        ...preset.physics,
        [field]: Number.isFinite(value) ? value : 0
      }
    }));
  }

  function handleUpdateCollider(
    field: "colliderSize" | "colliderOffset",
    axis: 0 | 1 | 2,
    value: number
  ): void {
    updateActiveMobPreset((preset) => {
      const nextValues = [...preset.physics[field]] as [number, number, number];
      nextValues[axis] = Number.isFinite(value) ? value : 0;

      return {
        ...preset,
        physics: {
          ...preset.physics,
          [field]: nextValues
        }
      };
    });
  }

  function handleToggleShowCollider(value: boolean): void {
    updateActiveMobPreset((preset) => ({
      ...preset,
      physics: {
        ...preset.physics,
        showCollider: value
      }
    }));
  }

  function handleResetMobPreset(): void {
    const defaultPreset = DEFAULT_IMPORTED_MOB_PRESETS[activeMobId];

    if (!defaultPreset) {
      return;
    }

    setImportError(null);
    setMobLabState((currentState) => ({
      ...currentState,
      presets: {
        ...currentState.presets,
        [activeMobId]: cloneMobPreset(defaultPreset)
      },
      selectedPartByMobId: {
        ...currentState.selectedPartByMobId,
        [activeMobId]: defaultPreset.parts[0]?.id ?? "body"
      }
    }));
  }

  function handleExportMobPreset(): void {
    const blob = new Blob([JSON.stringify(activeMobPreset, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${activeMobPreset.id}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function handleImportMobPreset(): void {
    importInputRef.current?.click();
  }

  async function handleMobImportFileChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    try {
      const nextText = await nextFile.text();
      const nextPreset = tryParseImportedMobPreset(nextText);

      if (!nextPreset) {
        setImportError("Could not read that preset JSON. Use a file exported from this Mob Lab.");
        return;
      }

      setImportError(null);
      setMobLabState((currentState) => ({
        ...currentState,
        activeMobId: nextPreset.id,
        presets: {
          ...currentState.presets,
          [nextPreset.id]: cloneMobPreset(nextPreset)
        },
        selectedPartByMobId: {
          ...currentState.selectedPartByMobId,
          [nextPreset.id]: currentState.selectedPartByMobId[nextPreset.id] ?? nextPreset.parts[0]?.id ?? "body"
        }
      }));
      onModeChange("mob_lab");
      onSelectMobChange(nextPreset.id);
      setStageResetToken((current) => current + 1);
    } catch {
      setImportError("The preset file could not be loaded.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div
      className={`preview-studio${
        presentation === "workspace" ? " preview-studio--workspace" : ""
      }`}
      role={presentation === "workspace" ? "region" : "dialog"}
      aria-label="Preview studio"
    >
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden-input"
        onChange={(event) => {
          void handleMobImportFileChange(event);
        }}
      />
      <div className={`preview-studio__panel${mode === "mob_lab" ? " preview-studio__panel--mob-lab" : ""}`}>
        <aside className="preview-studio__sidebar">
          <div className="preview-studio__header">
            <div>
              <h2 className="preview-studio__title">Preview Studio</h2>
              <p className="preview-studio__meta">
                {mode === "furniture"
                  ? <>Pick an item, snip the clean stage, then save a transparent PNG into<code> public/shop-previews</code>.</>
                  : <>Tune imported mob rigs, animation, locomotion, and collider values live before promoting them into gameplay.</>}
              </p>
            </div>
            <div className="preview-studio__mode-tabs" role="tablist" aria-label="Preview studio mode">
              <button
                className={`preview-studio__mode-tab${mode === "furniture" ? " preview-studio__mode-tab--active" : ""}`}
                onClick={() => onModeChange("furniture")}
                type="button"
              >
                Furniture Studio
              </button>
              <button
                className={`preview-studio__mode-tab${mode === "mob_lab" ? " preview-studio__mode-tab--active" : ""}`}
                onClick={() => onModeChange("mob_lab")}
                type="button"
              >
                Mob Lab
              </button>
            </div>
            <div className="preview-studio__toolbar">
              <button
                className="preview-studio__toolbar-button"
                onClick={() => setStageResetToken((current) => current + 1)}
                type="button"
              >
                Reset View
              </button>
              <button
                className="preview-studio__toolbar-button preview-studio__toolbar-button--secondary"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <div className="preview-studio__selection">
            {mode === "furniture" ? (
              catalogSections.map(([sectionName, entries]) => (
                <section key={sectionName} className="preview-studio__section">
                  <span className="preview-studio__section-title">{sectionName}</span>
                  <div className="preview-studio__item-list">
                    {entries.map((entry) => (
                      <button
                        key={entry.type}
                        className={`preview-studio__item-button${selectedType === entry.type ? " preview-studio__item-button--active" : ""}`}
                        onClick={() => onSelectTypeChange(entry.type)}
                        type="button"
                      >
                        <span>{entry.label}</span>
                        <span className="preview-studio__item-filename">{getPreviewFileName(entry.type)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <section className="preview-studio__section">
                <span className="preview-studio__section-title">Imported Mobs</span>
                <div className="preview-studio__item-list">
                  {availableMobPresets.map((preset) => (
                    <button
                      key={preset.id}
                      className={`preview-studio__item-button${activeMobId === preset.id ? " preview-studio__item-button--active" : ""}`}
                      onClick={() => onSelectMobChange(preset.id)}
                      type="button"
                    >
                      <span>{preset.label}</span>
                      <span className="preview-studio__item-filename">{preset.sourceLabel}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>

        <section className="preview-studio__stage-shell">
          <div className="preview-studio__stage-header">
            <div>
              <h3 className="preview-studio__stage-title">
                {mode === "furniture" ? selectedEntry.label : activeMobPreset.label}
              </h3>
              <p className="preview-studio__stage-meta">
                {mode === "furniture"
                  ? "Clean capture target with a fixed default shot for the shop card thumbnail."
                  : "5x5 grass-block Mob Lab stage with live rig, animation, locomotion, and collider editing."}
              </p>
            </div>
            <div className="preview-studio__stage-tools">
              {mode === "furniture" ? (
                <div className="preview-studio__backdrop-controls" aria-label="Preview backdrop color">
                  {PREVIEW_BACKDROP_OPTIONS.map((option) => (
                    <button
                      key={option.mode}
                      className={`preview-studio__backdrop-button${backdropMode === option.mode ? " preview-studio__backdrop-button--active" : ""}`}
                      onClick={() => setBackdropMode(option.mode)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="preview-studio__file-chip">
                {mode === "furniture" ? (
                  <>Save as <code>{getPreviewFileName(selectedType)}</code></>
                ) : (
                  <>Preset <code>{activeMobPreset.id}</code></>
                )}
              </div>
            </div>
          </div>
          <div className="preview-studio__stage-note">
            {mode === "furniture"
              ? "Drag the preview to orbit around the item. `Reset View` brings the camera back to the default shot for the selected item. After you save the PNG, tell me the filename and I will wire it into the shop and compress it if needed."
              : "Orbit around the platform to inspect the imported mob. Use the Mob Lab panel to move body parts, retune idle or walk cycles, adjust speed and loop preview, and line up the collider before exporting the preset JSON."}
          </div>
          <div className="preview-studio__stage">
            {mode === "furniture" ? (
              <FurniturePreviewStage
                backdropMode={backdropMode}
                selectedType={selectedType}
                stageKey={stageKey}
              />
            ) : (
              <Suspense fallback={null}>
                <MobLabStage
                  preset={activeMobPreset}
                  selectedPartId={selectedPartId}
                  stageKey={stageKey}
                />
              </Suspense>
            )}
          </div>
        </section>

        {mode === "mob_lab" ? (
          <Suspense fallback={null}>
            <MobLabEditorPanel
              importError={importError}
              onExportPreset={handleExportMobPreset}
              onOpenImport={handleImportMobPreset}
              onResetPreset={handleResetMobPreset}
              onSelectPart={handleSelectPart}
              onToggleShowCollider={handleToggleShowCollider}
              onUpdateCollider={handleUpdateCollider}
              onUpdateIdle={handleUpdateIdle}
              onUpdateLocomotion={handleUpdateLocomotion}
              onUpdatePart={handleUpdatePart}
              onUpdatePhysicsNumber={handleUpdatePhysicsNumber}
              onUpdateWalk={handleUpdateWalk}
              preset={activeMobPreset}
              selectedPartId={selectedPartId}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
