import { button, folder, useControls } from "leva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  controlHoursToMinutes,
  formatClock12h,
  formatClock24h,
  getLocalClockMinutes,
  minutesToControlHours,
  wrapClockMinutes
} from "../clock";
import {
  GameLoopManager,
  minutesToTicks,
  ticksToMinutes
} from "../../lib/gameLoop";
import {
  loadPersistedWorldSettings,
  savePersistedWorldSettings,
  type PersistedWorldSettings
} from "../../lib/devWorldSettings";

type LevaSettings = PersistedWorldSettings;

export interface SandboxWorldClockState {
  worldTimeMinutes: number;
  worldTicks: number;
  worldTimeLabel: string;
  worldTimeLabel12h: string;
  ampm: "AM" | "PM";
  useMinecraftTime: boolean;
  minecraftTimeHours: number;
  timeLocked: boolean;
  lockedTimeHours: number;
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  fogEnabled: boolean;
  fogDensity: number;
  ambientMultiplier: number;
  sunIntensityMultiplier: number;
  brightness: number;
  saturation: number;
  contrast: number;
  setUseMinecraftTime: (value: boolean) => void;
  setMinecraftTimeHours: (value: number) => void;
  setTimeLockedEnabled: (value: boolean) => void;
  setLockedTimeHours: (value: number) => void;
  syncLockedTimeToLocalTime: () => void;
  setSunEnabled: (value: boolean) => void;
  setShadowsEnabled: (value: boolean) => void;
  setFogEnabled: (value: boolean) => void;
  setFogDensity: (value: number) => void;
  setAmbientMultiplier: (value: number) => void;
  setSunIntensityMultiplier: (value: number) => void;
  setBrightness: (value: number) => void;
  setSaturation: (value: number) => void;
  setContrast: (value: number) => void;
}

function loadLevaSettings(): LevaSettings {
  return loadPersistedWorldSettings();
}

export function useSandboxWorldClock(): SandboxWorldClockState {
  const savedSettingsRef = useRef<LevaSettings | null>(null);

  if (savedSettingsRef.current === null) {
    savedSettingsRef.current = loadLevaSettings();
  }

  const savedSettings = savedSettingsRef.current;
  const [realTimeMinutes, setRealTimeMinutes] = useState(() =>
    Math.floor(getLocalClockMinutes())
  );
  const [minecraftTimeMinutes, setMinecraftTimeMinutes] = useState(() =>
    Math.floor(savedSettings.minecraftTimeMinutes ?? 360)
  );
  const worldTicksRef = useRef(
    minutesToTicks(savedSettings.minecraftTimeMinutes ?? 360)
  );
  const [useMinecraftTime, setUseMinecraftTime] = useState(
    savedSettings.useMinecraftTimeToggle ?? true
  );
  const [timeLocked, setTimeLocked] = useState(savedSettings.timeLocked ?? false);
  const [lockedTimeMinutes, setLockedTimeMinutes] = useState(() =>
    wrapClockMinutes(
      typeof savedSettings.lockedTimeMinutes === "number"
        ? savedSettings.lockedTimeMinutes
        : Math.round(getLocalClockMinutes())
    )
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
  const worldTime12h = useMemo(
    () => formatClock12h(worldTimeMinutes),
    [worldTimeMinutes]
  );
  const minecraftTimeHours = useMemo(
    () => (minecraftTimeMinutes / 60) % 24,
    [minecraftTimeMinutes]
  );
  const lockedTimeHours = useMemo(
    () => minutesToControlHours(lockedTimeMinutes),
    [lockedTimeMinutes]
  );
  const localTimeLabel = useMemo(
    () => formatClock24h(realTimeMinutes),
    [realTimeMinutes]
  );

  const gameLoopRef = useRef<GameLoopManager | null>(null);
  const syncingWorldControlsRef = useRef(false);
  const lastPublishedMinecraftMinuteRef = useRef(minecraftTimeMinutes);

  if (!gameLoopRef.current) {
    gameLoopRef.current = new GameLoopManager(minecraftTimeMinutes, (ticks) => {
      worldTicksRef.current = ticks;
      const nextMinecraftTimeMinutes = Math.floor(ticksToMinutes(ticks));

      if (nextMinecraftTimeMinutes === lastPublishedMinecraftMinuteRef.current) {
        return;
      }

      lastPublishedMinecraftMinuteRef.current = nextMinecraftTimeMinutes;
      setMinecraftTimeMinutes(nextMinecraftTimeMinutes);
    });
  }

  const applyMinecraftTimeMinutes = useCallback((nextMinutes: number) => {
    const wrappedMinutes = wrapClockMinutes(Math.round(nextMinutes));
    lastPublishedMinecraftMinuteRef.current = wrappedMinutes;
    worldTicksRef.current = minutesToTicks(wrappedMinutes);
    setMinecraftTimeMinutes(wrappedMinutes);
    gameLoopRef.current?.setMinutes(wrappedMinutes);
  }, []);

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
    "----- WORLD SETTINGS -----",
    () => ({
      localClock: {
        value: localTimeLabel,
        editable: false,
        label: "Local"
      },
      worldClock: {
        value: worldTimeLabel,
        editable: false,
        label: "World"
      },
      useMinecraftTimeToggle: {
        value: useMinecraftTime,
        label: "Minecraft Clock",
        onChange: (value: boolean, _path: string, context: { initial: boolean }) => {
          if (context.initial || syncingWorldControlsRef.current) {
            return;
          }

          setUseMinecraftTime(value);
        }
      },
      minecraftTime24h: {
        value: (minecraftTimeMinutes / 60) % 24,
        min: 0,
        max: 23.99,
        step: 0.1,
        label: "Minecraft Time",
        render: (get) => get("----- WORLD SETTINGS -----.useMinecraftTimeToggle"),
        onChange: (value: number, _path: string, context: { initial: boolean }) => {
          if (context.initial || syncingWorldControlsRef.current) {
            return;
          }

          applyMinecraftTimeMinutes(controlHoursToMinutes(value));
        }
      },
      lockTimeOfDay: {
        value: timeLocked,
        label: "Lock Time",
        transient: false,
        onChange: (value: boolean, _path: string, context: { initial: boolean }) => {
          if (context.initial || syncingWorldControlsRef.current) {
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
        label: "Locked Time",
        render: (get) => get("----- WORLD SETTINGS -----.lockTimeOfDay"),
        transient: false,
        onChange: (value: number, _path: string, context: { initial: boolean }) => {
          if (context.initial || syncingWorldControlsRef.current) {
            return;
          }

          setLockedTimeMinutes(controlHoursToMinutes(value));
        }
      },
      syncLockedTimeToLocalClock: {
        ...button(() => {
          setTimeLocked(true);
          setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
        }),
        label: "Sync To Local Time"
      },
      sunEnabled: {
        value: savedSettings.sunEnabled ?? true,
        label: "Sun"
      },
      shadowsEnabled: {
        value: savedSettings.shadowsEnabled ?? true,
        label: "Shadows"
      },
      "----- ATMOSPHERE -----": folder({
        fogEnabled: {
          value: savedSettings.fogEnabled ?? true,
          label: "Fog"
        },
        fogDensity: {
          value: savedSettings.fogDensity ?? 0.02,
          min: 0,
          max: 0.1,
          step: 0.001,
          label: "Density"
        }
      }),
      "----- LIGHTING -----": folder({
        ambientMultiplier: {
          value: savedSettings.ambientMultiplier ?? 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.1,
          label: "Ambient"
        },
        sunIntensityMultiplier: {
          value: savedSettings.sunIntensityMultiplier ?? 1.0,
          min: 0.0,
          max: 3.0,
          step: 0.1,
          label: "Sun Light"
        }
      }),
      "----- POST PROCESSING -----": folder({
        brightness: {
          value: savedSettings.brightness ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05,
          label: "Brightness"
        },
        saturation: {
          value: savedSettings.saturation ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05,
          label: "Saturation"
        },
        contrast: {
          value: savedSettings.contrast ?? 1.0,
          min: 0.0,
          max: 2.0,
          step: 0.05,
          label: "Contrast"
        }
      })
    }),
    []
  );

  const syncLockedTimeToLocalTime = useCallback(() => {
    setTimeLocked(true);
    setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
  }, [realTimeMinutes]);

  const setMinecraftTimeHoursValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    applyMinecraftTimeMinutes(controlHoursToMinutes(value));
  }, [applyMinecraftTimeMinutes]);

  const setTimeLockedEnabled = useCallback((value: boolean) => {
    if (value) {
      setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
    }

    setTimeLocked(value);
  }, [realTimeMinutes]);

  const setLockedTimeHoursValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    setLockedTimeMinutes(controlHoursToMinutes(value));
  }, []);

  const updateWorldSetting = useCallback((patch: Record<string, unknown>) => {
    setWorldSettings(patch as never);
  }, [setWorldSettings]);

  const setSunEnabledValue = useCallback((value: boolean) => {
    updateWorldSetting({ sunEnabled: value });
  }, [updateWorldSetting]);

  const setShadowsEnabledValue = useCallback((value: boolean) => {
    updateWorldSetting({ shadowsEnabled: value });
  }, [updateWorldSetting]);

  const setFogEnabledValue = useCallback((value: boolean) => {
    updateWorldSetting({ fogEnabled: value });
  }, [updateWorldSetting]);

  const setFogDensityValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ fogDensity: value });
  }, [updateWorldSetting]);

  const setAmbientMultiplierValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ ambientMultiplier: value });
  }, [updateWorldSetting]);

  const setSunIntensityMultiplierValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ sunIntensityMultiplier: value });
  }, [updateWorldSetting]);

  const setBrightnessValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ brightness: value });
  }, [updateWorldSetting]);

  const setSaturationValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ saturation: value });
  }, [updateWorldSetting]);

  const setContrastValue = useCallback((value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    updateWorldSetting({ contrast: value });
  }, [updateWorldSetting]);

  useEffect(() => {
    const syncLocalClock = () => {
      const nextMinutes = Math.floor(getLocalClockMinutes());
      setRealTimeMinutes((current) =>
        current === nextMinutes ? current : nextMinutes
      );
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
    syncingWorldControlsRef.current = true;
    setWorldSettings({
      localClock: localTimeLabel,
      worldClock: worldTimeLabel,
      useMinecraftTimeToggle: useMinecraftTime,
      minecraftTime24h: minecraftTimeHours,
      lockTimeOfDay: timeLocked,
      lockedTime24h: lockedTimeHours
    });
    syncingWorldControlsRef.current = false;
  }, [
    localTimeLabel,
    lockedTimeHours,
    minecraftTimeHours,
    setWorldSettings,
    timeLocked,
    useMinecraftTime,
    worldTimeLabel
  ]);

  useEffect(() => {
    savePersistedWorldSettings({
      minecraftTimeMinutes,
      useMinecraftTimeToggle: useMinecraftTime,
      timeLocked,
      lockedTimeMinutes,
      sunEnabled,
      shadowsEnabled,
      fogEnabled,
      fogDensity,
      ambientMultiplier,
      sunIntensityMultiplier,
      brightness,
      saturation,
      contrast
    });
  }, [
    ambientMultiplier,
    brightness,
    contrast,
    fogDensity,
    fogEnabled,
    lockedTimeMinutes,
    minecraftTimeMinutes,
    saturation,
    shadowsEnabled,
    sunEnabled,
    sunIntensityMultiplier,
    timeLocked,
    useMinecraftTime
  ]);

  return {
    worldTimeMinutes,
    worldTicks: worldTicksRef.current,
    worldTimeLabel,
    worldTimeLabel12h: worldTime12h.time,
    ampm: worldTime12h.ampm,
    useMinecraftTime,
    minecraftTimeHours,
    timeLocked,
    lockedTimeHours,
    sunEnabled,
    shadowsEnabled,
    fogEnabled,
    fogDensity,
    ambientMultiplier,
    sunIntensityMultiplier,
    brightness,
    saturation,
    contrast,
    setUseMinecraftTime,
    setMinecraftTimeHours: setMinecraftTimeHoursValue,
    setTimeLockedEnabled,
    setLockedTimeHours: setLockedTimeHoursValue,
    syncLockedTimeToLocalTime,
    setSunEnabled: setSunEnabledValue,
    setShadowsEnabled: setShadowsEnabledValue,
    setFogEnabled: setFogEnabledValue,
    setFogDensity: setFogDensityValue,
    setAmbientMultiplier: setAmbientMultiplierValue,
    setSunIntensityMultiplier: setSunIntensityMultiplierValue,
    setBrightness: setBrightnessValue,
    setSaturation: setSaturationValue,
    setContrast: setContrastValue
  };
}