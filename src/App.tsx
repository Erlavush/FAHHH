import { ChangeEvent, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultSandboxState,
  loadPersistedSandboxState,
  savePersistedSandboxState
} from "./lib/devLocalState";
import {
  FURNITURE_REGISTRY,
  type FurnitureCatalogCategory,
  type FurnitureType
} from "./lib/furnitureRegistry";
import {
  createDefaultRoomState,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "./lib/roomState";
import { useControls, folder, Leva } from "leva";

type FurnitureSpawnRequest = {
  requestId: number;
  type: FurnitureType;
};

type PlayerInteractionStatus =
  | {
      phase: "approaching" | "active";
      label: string;
    }
  | null;

const RoomView = lazy(async () => {
  const module = await import("./components/RoomView");
  return { default: module.RoomView };
});

const DEFAULT_CAMERA_POSITION: Vector3Tuple = [10.5, 8.7, 10.5];
const DEFAULT_PLAYER_POSITION: Vector3Tuple = [0, 0, 0.85];

function App() {
  const initialSandboxState = useMemo(
    () =>
      loadPersistedSandboxState(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_PLAYER_POSITION,
        createDefaultRoomState()
      ),
    []
  );
  const [buildModeEnabled, setBuildModeEnabled] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [skinSrc, setSkinSrc] = useState<string | null>(initialSandboxState.skinSrc);
  const [skinError, setSkinError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);

  const { timeOfDay, sunEnabled, shadowsEnabled, checkerEnabled, floorPrimaryColor, floorSecondaryColor } = useControls("World Settings", {
    timeOfDay: { options: ["day", "night"] },
    sunEnabled: true,
    shadowsEnabled: true,
    Checkerboard: folder({
      checkerEnabled: false,
      floorPrimaryColor: "#f1f1f1",
      floorSecondaryColor: "#e5e5e5"
    })
  });
  const [cameraPosition, setCameraPosition] = useState<Vector3Tuple>(initialSandboxState.cameraPosition);
  const [playerPosition, setPlayerPosition] = useState<Vector3Tuple>(initialSandboxState.playerPosition);
  const [roomState, setRoomState] = useState<RoomState>(initialSandboxState.roomState);
  const [spawnRequest, setSpawnRequest] = useState<FurnitureSpawnRequest | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [standRequestToken, setStandRequestToken] = useState(0);
  const [playerInteractionStatus, setPlayerInteractionStatus] =
    useState<PlayerInteractionStatus>(null);
  const skinInputRef = useRef<HTMLInputElement | null>(null);
  const nextSpawnRequestIdRef = useRef(1);

  const vectorsMatch = useCallback((first: Vector3Tuple, second: Vector3Tuple) => {
    return (
      Math.abs(first[0] - second[0]) < 0.0001 &&
      Math.abs(first[1] - second[1]) < 0.0001 &&
      Math.abs(first[2] - second[2]) < 0.0001
    );
  }, []);

  const placementListsMatch = useCallback(
    (first: RoomFurniturePlacement[], second: RoomFurniturePlacement[]) => {
      return (
        first.length === second.length &&
        first.every((placement, index) => {
          const other = second[index];

          return (
            placement.id === other.id &&
            placement.type === other.type &&
            placement.surface === other.surface &&
            placement.anchorFurnitureId === other.anchorFurnitureId &&
            Math.abs(placement.position[0] - other.position[0]) < 0.0001 &&
            Math.abs(placement.position[1] - other.position[1]) < 0.0001 &&
            Math.abs(placement.position[2] - other.position[2]) < 0.0001 &&
            Math.abs((placement.surfaceLocalOffset?.[0] ?? 0) - (other.surfaceLocalOffset?.[0] ?? 0)) < 0.0001 &&
            Math.abs((placement.surfaceLocalOffset?.[1] ?? 0) - (other.surfaceLocalOffset?.[1] ?? 0)) < 0.0001 &&
            Math.abs(placement.rotationY - other.rotationY) < 0.0001
          );
        })
      );
    },
    []
  );

  useEffect(() => {
    savePersistedSandboxState({
      version: 1,
      skinSrc,
      cameraPosition,
      playerPosition,
      roomState
    });
  }, [cameraPosition, playerPosition, roomState, skinSrc]);

  const catalogSections = useMemo(() => {
    const grouped = new Map<FurnitureCatalogCategory, Array<(typeof FURNITURE_REGISTRY)[FurnitureType]>>();

    (Object.values(FURNITURE_REGISTRY) as Array<(typeof FURNITURE_REGISTRY)[FurnitureType]>).forEach(
      (entry) => {
        const currentItems = grouped.get(entry.category) ?? [];
        currentItems.push(entry);
        grouped.set(entry.category, currentItems);
      }
    );

    return Array.from(grouped.entries());
  }, []);

  function handleSkinImport(): void {
    skinInputRef.current?.click();
  }

  function handleSkinFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "image/png") {
      setSkinError("Use a PNG skin file in the normal Minecraft format.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setSkinError("That skin file could not be read.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
          setSkinError("Use a 64x64 or 64x32 Minecraft skin PNG.");
          return;
        }

        setSkinSrc(result);
        setSkinError(null);
      };
      image.onerror = () => {
        setSkinError("That skin image could not be loaded.");
      };
      image.src = result;
    };

    reader.onerror = () => {
      setSkinError("That skin file could not be read.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSpawnFurniture(type: FurnitureType): void {
    setBuildModeEnabled(true);
    setCatalogOpen(true);
    setSpawnRequest({
      requestId: nextSpawnRequestIdRef.current,
      type
    });
    nextSpawnRequestIdRef.current += 1;
  }

  function handleResetCamera(): void {
    setCameraPosition(DEFAULT_CAMERA_POSITION);
    setCameraResetToken((current) => current + 1);
  }

  const handleCommittedFurnitureChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    setRoomState((currentRoomState) => {
      if (placementListsMatch(currentRoomState.furniture, placements)) {
        return currentRoomState;
      }

      return {
        ...currentRoomState,
        furniture: placements
      };
    });
  }, [placementListsMatch]);

  const handleCameraPositionChange = useCallback((position: Vector3Tuple): void => {
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [vectorsMatch]);

  const handlePlayerPositionChange = useCallback((position: Vector3Tuple): void => {
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [vectorsMatch]);

  function handleResetSandbox(): void {
    const nextSandbox = createDefaultSandboxState(DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION);

    setCameraPosition(nextSandbox.cameraPosition);
    setPlayerPosition(nextSandbox.playerPosition);
    setSkinSrc(nextSandbox.skinSrc);
    setRoomState(nextSandbox.roomState);
    setSpawnRequest(null);
    setBuildModeEnabled(false);
    setCatalogOpen(false);
    setGridSnapEnabled(true);
    setPlayerInteractionStatus(null);
    setCameraResetToken((current) => current + 1);
  }

  const [, setLiveCoords] = useControls("Live Coordinates", () => ({
    Player: folder({
      pX: { value: playerPosition[0], label: 'x', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [v, prev[1], prev[2]]) } },
      pY: { value: playerPosition[1], label: 'y', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [prev[0], v, prev[2]]) } },
      pZ: { value: playerPosition[2], label: 'z', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [prev[0], prev[1], v]) } }
    }),
    Camera: folder({
      cX: { value: cameraPosition[0], label: 'x', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [v, prev[1], prev[2]]) } },
      cY: { value: cameraPosition[1], label: 'y', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [prev[0], v, prev[2]]) } },
      cZ: { value: cameraPosition[2], label: 'z', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [prev[0], prev[1], v]) } }
    })
  }));

  const [, setRoomStateUI] = useControls("Room State", () => ({
    Theme: { value: roomState.metadata.roomTheme, editable: false },
    Layout: { value: `v${roomState.metadata.layoutVersion}`, editable: false },
    Items: { value: `${roomState.furniture.length}`, editable: false }
  }));

  useEffect(() => {
    setLiveCoords({
      pX: playerPosition[0],
      pY: playerPosition[1],
      pZ: playerPosition[2],
      cX: cameraPosition[0],
      cY: cameraPosition[1],
      cZ: cameraPosition[2]
    } as any);
  }, [playerPosition, cameraPosition, setLiveCoords]);

  useEffect(() => {
    setRoomStateUI({
      Theme: roomState.metadata.roomTheme,
      Layout: `v${roomState.metadata.layoutVersion}`,
      Items: `${roomState.furniture.length}`
    });
  }, [roomState, setRoomStateUI]);

  return (
    <>
      <Leva hidden={!debugOpen} />
      <div className="scene-shell">
      <div className="scene-toolbar">
        <button
          className={`camera-toggle${buildModeEnabled ? " camera-toggle--active" : ""}`}
          disabled={playerInteractionStatus !== null && !buildModeEnabled}
          onClick={() =>
            setBuildModeEnabled((current) => {
              if (!current && playerInteractionStatus) {
                return current;
              }

              const nextValue = !current;

              if (!nextValue) {
                setCatalogOpen(false);
              }

              return nextValue;
            })
          }
          type="button"
        >
          {buildModeEnabled ? "Build Mode: On" : "Build Mode: Off"}
        </button>
        <button
          className={`camera-toggle${catalogOpen ? " camera-toggle--active" : ""}`}
          disabled={playerInteractionStatus !== null}
          onClick={() => {
            if (playerInteractionStatus) {
              return;
            }

            setBuildModeEnabled(true);
            setCatalogOpen((current) => !current);
          }}
          type="button"
        >
          {catalogOpen ? "Catalog: On" : "Catalog: Off"}
        </button>
        <button
          className={`camera-toggle${gridSnapEnabled ? " camera-toggle--active" : ""}`}
          onClick={() => setGridSnapEnabled((current) => !current)}
          type="button"
        >
          {gridSnapEnabled ? "Grid Snap: On" : "Grid Snap: Off"}
        </button>
        <button className="camera-toggle" onClick={handleSkinImport} type="button">
          Import Minecraft Skin
        </button>
        <button className="camera-toggle" onClick={handleResetCamera} type="button">
          Reset Camera
        </button>
        <button className="camera-toggle" onClick={handleResetSandbox} type="button">
          Reset Room
        </button>
        {playerInteractionStatus ? (
          <button
            className="camera-toggle camera-toggle--active"
            onClick={() => setStandRequestToken((current) => current + 1)}
            type="button"
          >
            {playerInteractionStatus.phase === "active"
              ? `Stand Up (${playerInteractionStatus.label})`
              : `Cancel ${playerInteractionStatus.label}`}
          </button>
        ) : null}
        <button
          className={`camera-toggle${debugOpen ? " camera-toggle--active" : ""}`}
          onClick={() => setDebugOpen((current) => !current)}
          type="button"
        >
          {debugOpen ? "Dev Panel: On" : "Dev Panel: Off"}
        </button>
      </div>

      {catalogOpen ? (
        <aside className="spawn-panel">
          <span className="spawn-panel__title">Room Builder Catalog</span>
          {catalogSections.map(([sectionName, entries]) => (
            <section key={sectionName} className="spawn-section">
              <span className="spawn-section__title">{sectionName}</span>
              <div className="spawn-grid">
                {entries.map((entry) => (
                  <button
                    key={entry.type}
                    className="spawn-card"
                    onClick={() => handleSpawnFurniture(entry.type)}
                    type="button"
                  >
                    <strong>{entry.label}</strong>
                    <span>{entry.surface === "wall" ? "Wall item" : entry.category}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </aside>
      ) : null}

      {skinError ? <div className="scene-note">{skinError}</div> : null}



      <input
        ref={skinInputRef}
        type="file"
        accept=".png,image/png"
        className="hidden-input"
        onChange={handleSkinFileChange}
      />

      <Suspense fallback={<div className="canvas-fallback">Loading scene...</div>}>
        <RoomView
          buildModeEnabled={buildModeEnabled}
          gridSnapEnabled={gridSnapEnabled}
          spawnRequest={spawnRequest}
          cameraResetToken={cameraResetToken}
          standRequestToken={standRequestToken}
          initialCameraPosition={cameraPosition}
          initialPlayerPosition={playerPosition}
          initialFurniturePlacements={roomState.furniture}
          skinSrc={skinSrc}
          timeOfDay={timeOfDay as "day" | "night"}
          sunEnabled={sunEnabled}
          shadowsEnabled={shadowsEnabled}
          checkerEnabled={checkerEnabled}
          floorPrimaryColor={floorPrimaryColor}
          floorSecondaryColor={floorSecondaryColor}
          onCameraPositionChange={handleCameraPositionChange}
          onPlayerPositionChange={handlePlayerPositionChange}
          onCommittedFurnitureChange={handleCommittedFurnitureChange}
          onInteractionStateChange={setPlayerInteractionStatus}
        />
      </Suspense>
    </div>
    </>
  );
}

export default App;
