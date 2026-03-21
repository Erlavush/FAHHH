import { button, folder, useControls } from "leva";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  controlHoursToMinutes,
  formatClock24h,
  getLocalClockMinutes,
  minutesToControlHours,
  wrapClockMinutes
} from "../clock";
import { GameLoopManager, ticksToMinutes } from "../../lib/gameLoop";

const LEVA_SETTINGS_KEY = "cozy-room-leva-settings";

interface LevaSettings {
  minecraftTimeMinutes?: number;
  useMinecraftTimeToggle?: boolean;
  sunEnabled?: boolean;
  shadowsEnabled?: boolean;
  fogEnabled?: boolean;
  fogDensity?: number;
  ambientMultiplier?: number;
  sunIntensityMultiplier?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;
}

export interface SandboxWorldClockState {
  worldTimeMinutes: number;
  worldTicks: number;
  worldTimeLabel: string;
  timeLocked: boolean;
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  fogEnabled: boolean;
  fogDensity: number;
  ambientMultiplier: number;
  sunIntensityMultiplier: number;
  brightness: number;
  saturation: number;
  contrast: number;
}

function loadLevaSettings(): LevaSettings {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {};
  }

  try {
    const data = window.localStorage.getItem(LEVA_SETTINGS_KEY);
    return data ? (JSON.parse(data) as LevaSettings) : {};
  } catch {
    return {};
  }
}

export function useSandboxWorldClock(): SandboxWorldClockState {
  const savedSettingsRef = useRef<LevaSettings | null>(null);

  if (savedSettingsRef.current === null) {
    savedSettingsRef.current = loadLevaSettings();
  }

  const savedSettings = savedSettingsRef.current;
  const [realTimeMinutes, setRealTimeMinutes] = useState(() => getLocalClockMinutes());
  const [minecraftTimeMinutes, setMinecraftTimeMinutes] = useState(
    savedSettings.minecraftTimeMinutes ?? 360
  );
  const [worldTicks, setWorldTicks] = useState(0);

  const [useMinecraftTime, setUseMinecraftTime] = useState(
    savedSettings.useMinecraftTimeToggle ?? true
  );
  const [timeLocked, setTimeLocked] = useState(false);
  const [lockedTimeMinutes, setLockedTimeMinutes] = useState(() =>
    wrapClockMinutes(Math.round(getLocalClockMinutes()))
  );

  const worldTimeMinutes = timeLocked
    ? lockedTimeMinutes
    : useMinecraftTime
      ? minecraftTimeMinutes
      : realTimeMinutes;

  const worldTimeLabel = useMemo(
    () => formatClock24h(worldTimeMinutes),
    [worldTimeMinutes]
  );
  const localTimeLabel = useMemo(
    () => formatClock24h(realTimeMinutes),
    [realTimeMinutes]
  );

  const gameLoopRef = useRef<GameLoopManager | null>(null);

  if (!gameLoopRef.current) {
    gameLoopRef.current = new GameLoopManager(minecraftTimeMinutes, (ticks) => {
      setWorldTicks(ticks);
      setMinecraftTimeMinutes(ticksToMinutes(ticks));
    });
  }

  const [
    {
      sunEnabled,
      shadowsEnabled,
      fogEnabled,
      fogDensity,
      ambientMultiplier,
      sunIntensityMultiplier,
      brightness,
      saturation,
      contrast
    },
    setWorldSettings
  ] = useControls(
    "World Settings",
    () => ({
      localClock: {
        value: localTimeLabel,
        editable: false,
        label: "Local Time"
      },
      worldClock: {
        value: worldTimeLabel,
        editable: false,
        label: "World Time"
      },
      useMinecraftTimeToggle: {
        value: useMinecraftTime,
        label: "Use Minecraft Time",
        onChange: (value: boolean) => setUseMinecraftTime(value)
      },
      minecraftTime24h: {
        value: (minecraftTimeMinutes / 60) % 24,
        min: 0,
        max: 23.99,
        step: 0.1,
        label: "Minecraft Time (24h)",
        render: (get) => get("World Settings.useMinecraftTimeToggle"),
        onChange: (value: number, _path: string, context: { initial: boolean }) => {
          if (!context.initial) {
            setMinecraftTimeMinutes(value * 60);
            gameLoopRef.current?.setMinutes(value * 60);
          }
        }
      },
      lockTimeOfDay: {
        value: timeLocked,
        label: "Lock Time",
        transient: false,
        onChange: (value: boolean, _path: string, context: { initial: boolean }) => {
          if (context.initial) {
            return;
          }

          if (value) {
            setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
          }

          setTimeLocked(value);
        }
      },
      lockedTime24h: {
        value: minutesToControlHours(lockedTimeMinutes),
        min: 0,
        max: 23.983333333333334,
        step: 1 / 60,
        label: "Locked Time (24h)",
        render: (get) => get("World Settings.lockTimeOfDay"),
        transient: false,
        onChange: (value: number, _path: string, context: { initial: boolean }) => {
          if (context.initial) {
            return;
          }

          setLockedTimeMinutes(controlHoursToMinutes(value));
        }
      },
      syncLockToNow: button(() => {
        setTimeLocked(true);
        setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
      }),
      sunEnabled: savedSettings.sunEnabled ?? true,
      shadowsEnabled: savedSettings.shadowsEnabled ?? true,
      "Sky & Atmosphere": folder({
        fogEnabled: savedSettings.fogEnabled ?? true,
        fogDensity: {
          value: savedSettings.fogDensity ?? 0.02,
          min: 0,
          max: 0.1,
          step: 0.001
        }
      }),
      "Lighting & Shadows": folder({
        ambientMultiplier: {
          value: savedSettings.ambientMultiplier ?? 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.1
        },
        sunIntensityMultiplier: {
          value: savedSettings.sunIntensityMultiplier ?? 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.1
        }
      }),
      "Post-Processing": folder({
        brightness: {
          value: savedSettings.brightness ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05
        },
        saturation: {
          value: savedSettings.saturation ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05
        },
        contrast: {
          value: savedSettings.contrast ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05
        }
      })
    }),
    []
  );

  useEffect(() => {
    const syncLocalClock = () => {
      setRealTimeMinutes(getLocalClockMinutes());
    };

    syncLocalClock();
    const localIntervalId = window.setInterval(syncLocalClock, 1000);

    return () => {
      window.clearInterval(localIntervalId);
    };
  }, []);

  useEffect(() => {
    if (!useMinecraftTime || timeLocked) {
      return;
    }

    let frameId: number;
    const loop = () => {
      gameLoopRef.current?.update(Date.now());
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [timeLocked, useMinecraftTime]);

  useEffect(() => {
    setWorldSettings({
      localClock: localTimeLabel,
      worldClock: worldTimeLabel,
      useMinecraftTimeToggle: useMinecraftTime,
      minecraftTime24h: (minecraftTimeMinutes / 60) % 24,
      lockTimeOfDay: timeLocked,
      lockedTime24h: minutesToControlHours(lockedTimeMinutes)
    });
  }, [
    localTimeLabel,
    lockedTimeMinutes,
    minecraftTimeMinutes,
    setWorldSettings,
    timeLocked,
    useMinecraftTime,
    worldTimeLabel
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        LEVA_SETTINGS_KEY,
        JSON.stringify({
          minecraftTimeMinutes,
          useMinecraftTimeToggle: useMinecraftTime,
          sunEnabled,
          shadowsEnabled,
          fogEnabled,
          fogDensity,
          ambientMultiplier,
          sunIntensityMultiplier,
          brightness,
          saturation,
          contrast
        })
      );
    } catch {
      // Ignore dev-only local storage failures.
    }
  }, [
    ambientMultiplier,
    brightness,
    contrast,
    fogDensity,
    fogEnabled,
    minecraftTimeMinutes,
    saturation,
    shadowsEnabled,
    sunEnabled,
    sunIntensityMultiplier,
    useMinecraftTime
  ]);

  return {
    worldTimeMinutes,
    worldTicks,
    worldTimeLabel,
    timeLocked,
    sunEnabled,
    shadowsEnabled,
    fogEnabled,
    fogDensity,
    ambientMultiplier,
    sunIntensityMultiplier,
    brightness,
    saturation,
    contrast
  };
}