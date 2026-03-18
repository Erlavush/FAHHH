import { ChangeEvent, Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  loadPersistedCameraPosition,
  loadPersistedPlayerPosition,
  loadPersistedSkin,
  savePersistedCameraPosition,
  savePersistedPlayerPosition,
  savePersistedSkin
} from "./lib/devLocalState";

type Vector3Tuple = [number, number, number];

const RoomView = lazy(async () => {
  const module = await import("./components/RoomView");
  return { default: module.RoomView };
});

const DEFAULT_CAMERA_POSITION: Vector3Tuple = [7.5, 6.5, 7.5];
const DEFAULT_PLAYER_POSITION: Vector3Tuple = [0, 0, 0];

function App() {
  const [cameraEditEnabled, setCameraEditEnabled] = useState(false);
  const [buildModeEnabled, setBuildModeEnabled] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [skinSrc, setSkinSrc] = useState<string | null>(() => loadPersistedSkin());
  const [skinError, setSkinError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night">("day");
  const [sunEnabled, setSunEnabled] = useState(true);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [checkerEnabled, setCheckerEnabled] = useState(false);
  const [floorPrimaryColor, setFloorPrimaryColor] = useState("#f1f1f1");
  const [floorSecondaryColor, setFloorSecondaryColor] = useState("#e5e5e5");
  const [cameraPosition, setCameraPosition] = useState<Vector3Tuple>(() =>
    loadPersistedCameraPosition(DEFAULT_CAMERA_POSITION)
  );
  const [playerPosition, setPlayerPosition] = useState<Vector3Tuple>(() =>
    loadPersistedPlayerPosition(DEFAULT_PLAYER_POSITION)
  );
  const skinInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    savePersistedSkin(skinSrc);
  }, [skinSrc]);

  useEffect(() => {
    savePersistedCameraPosition(cameraPosition);
  }, [cameraPosition]);

  useEffect(() => {
    savePersistedPlayerPosition(playerPosition);
  }, [playerPosition]);

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

  return (
    <div className="scene-shell">
      <div className="scene-toolbar">
        <button
          className={`camera-toggle${cameraEditEnabled ? " camera-toggle--active" : ""}`}
          onClick={() => setCameraEditEnabled((current) => !current)}
          type="button"
        >
          {cameraEditEnabled ? "Camera Edit: On" : "Camera Edit: Off"}
        </button>
        <button
          className={`camera-toggle${buildModeEnabled ? " camera-toggle--active" : ""}`}
          onClick={() => setBuildModeEnabled((current) => !current)}
          type="button"
        >
          {buildModeEnabled ? "Build Mode: On" : "Build Mode: Off"}
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
        <button
          className={`camera-toggle${debugOpen ? " camera-toggle--active" : ""}`}
          onClick={() => setDebugOpen((current) => !current)}
          type="button"
        >
          {debugOpen ? "Dev Panel: On" : "Dev Panel: Off"}
        </button>
      </div>

      {skinError ? <div className="scene-note">{skinError}</div> : null}

      {debugOpen ? (
        <aside className="debug-panel">
          <div className="debug-section">
            <span className="debug-title">Live Coordinates</span>
            <div className="debug-readout">
              <strong>Player</strong>
              <span>{`x: ${playerPosition[0].toFixed(3)}`}</span>
              <span>{`y: ${playerPosition[1].toFixed(3)}`}</span>
              <span>{`z: ${playerPosition[2].toFixed(3)}`}</span>
            </div>
            <div className="debug-readout">
              <strong>Camera</strong>
              <span>{`x: ${cameraPosition[0].toFixed(3)}`}</span>
              <span>{`y: ${cameraPosition[1].toFixed(3)}`}</span>
              <span>{`z: ${cameraPosition[2].toFixed(3)}`}</span>
            </div>
          </div>

          <div className="debug-section">
            <span className="debug-title">World Lighting</span>
            <label className="debug-row">
              <span>Day Mode</span>
              <input
                type="checkbox"
                checked={timeOfDay === "day"}
                onChange={(event) => setTimeOfDay(event.target.checked ? "day" : "night")}
              />
            </label>
            <label className="debug-row">
              <span>Sun</span>
              <input
                type="checkbox"
                checked={sunEnabled}
                onChange={(event) => setSunEnabled(event.target.checked)}
              />
            </label>
            <label className="debug-row">
              <span>Shadows</span>
              <input
                type="checkbox"
                checked={shadowsEnabled}
                onChange={(event) => setShadowsEnabled(event.target.checked)}
              />
            </label>
          </div>

          <div className="debug-section">
            <span className="debug-title">Floor</span>
            <label className="debug-row">
              <span>Checker Pattern</span>
              <input
                type="checkbox"
                checked={checkerEnabled}
                onChange={(event) => setCheckerEnabled(event.target.checked)}
              />
            </label>
            <label className="debug-row">
              <span>Primary Color</span>
              <input
                type="color"
                value={floorPrimaryColor}
                onChange={(event) => setFloorPrimaryColor(event.target.value)}
              />
            </label>
            <label className="debug-row">
              <span>Secondary Color</span>
              <input
                type="color"
                value={floorSecondaryColor}
                disabled={!checkerEnabled}
                onChange={(event) => setFloorSecondaryColor(event.target.value)}
              />
            </label>
          </div>
        </aside>
      ) : null}

      <input
        ref={skinInputRef}
        type="file"
        accept=".png,image/png"
        className="hidden-input"
        onChange={handleSkinFileChange}
      />

      <Suspense fallback={<div className="canvas-fallback">Loading scene...</div>}>
        <RoomView
          cameraEditEnabled={cameraEditEnabled}
          buildModeEnabled={buildModeEnabled}
          gridSnapEnabled={gridSnapEnabled}
          initialCameraPosition={cameraPosition}
          initialPlayerPosition={playerPosition}
          skinSrc={skinSrc}
          timeOfDay={timeOfDay}
          sunEnabled={sunEnabled}
          shadowsEnabled={shadowsEnabled}
          checkerEnabled={checkerEnabled}
          floorPrimaryColor={floorPrimaryColor}
          floorSecondaryColor={floorSecondaryColor}
          onCameraPositionChange={setCameraPosition}
          onPlayerPositionChange={setPlayerPosition}
        />
      </Suspense>
    </div>
  );
}

export default App;
