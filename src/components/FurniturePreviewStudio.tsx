import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
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

type PreviewBackdropMode = "green" | "black" | "white";

type FurniturePreviewStudioProps = {
  catalogSections: Array<[FurnitureCatalogCategory, FurnitureDefinition[]]>;
  selectedType: FurnitureType;
  onSelectTypeChange: (type: FurnitureType) => void;
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

export function FurniturePreviewStudio({
  catalogSections,
  selectedType,
  onSelectTypeChange,
  onClose
}: FurniturePreviewStudioProps) {
  const [stageResetToken, setStageResetToken] = useState(0);
  const [backdropMode, setBackdropMode] = useState<PreviewBackdropMode>("green");
  const selectedEntry = getFurnitureDefinition(selectedType);
  const stageKey = `${selectedType}-${backdropMode}-${stageResetToken}`;

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
  }, [selectedType]);

  return (
    <div className="preview-studio" role="dialog" aria-label="Furniture preview studio">
      <div className="preview-studio__panel">
        <aside className="preview-studio__sidebar">
          <div className="preview-studio__header">
            <div>
              <h2 className="preview-studio__title">Preview Studio</h2>
              <p className="preview-studio__meta">
                Pick an item, snip the clean stage, then save a transparent PNG into
                <code> public/shop-previews</code>.
              </p>
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
            {catalogSections.map(([sectionName, entries]) => (
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
            ))}
          </div>
        </aside>

        <section className="preview-studio__stage-shell">
          <div className="preview-studio__stage-header">
            <div>
              <h3 className="preview-studio__stage-title">{selectedEntry.label}</h3>
              <p className="preview-studio__stage-meta">
                Clean capture target with a fixed default shot for the shop card thumbnail.
              </p>
            </div>
            <div className="preview-studio__stage-tools">
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
              <div className="preview-studio__file-chip">
                Save as <code>{getPreviewFileName(selectedType)}</code>
              </div>
            </div>
          </div>
          <div className="preview-studio__stage-note">
            Drag the preview to orbit around the item. `Reset View` brings the camera back to the default shot
            for the selected item. After you save the PNG, tell me the filename and I will wire it into the
            shop and compress it if needed.
          </div>
          <div className="preview-studio__stage">
            <FurniturePreviewStage
              backdropMode={backdropMode}
              selectedType={selectedType}
              stageKey={stageKey}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
