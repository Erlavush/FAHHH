import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { useUiScale } from "../../app/hooks/useUiScale";
import "./background-music-player.css";

const TRACK_SOURCE = "/audio/bruno-mars-risk-it-all.mp3";
const TRACK_PATH_LABEL = String.raw`C:\Users\user\Downloads\Bruno Mars - Risk It All.mp3`;
const DEFAULT_VOLUME = 0.42;
const SEEK_STEP_SECONDS = 10;
const PLAYBACK_RATES = [0.85, 1, 1.15, 1.3];

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0:00";
  }

  const safeSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatPlaybackRate(playbackRate: number) {
  return Number.isInteger(playbackRate) ? `${playbackRate.toFixed(0)}x` : `${playbackRate.toFixed(2)}x`;
}

export function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [requiresInteraction, setRequiresInteraction] = useState(false);
  const uiScale = useUiScale();

  const attemptPlayback = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      setLoadError(null);
      await audio.play();
      setRequiresInteraction(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setRequiresInteraction(true);
        return;
      }

      setLoadError("Track unavailable");
    }
  }, []);

  const setAudioTime = useCallback((nextTime: number) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const effectiveDuration = Number.isFinite(audio.duration) ? audio.duration : duration;
    const clampedTime = Math.max(0, Math.min(nextTime, effectiveDuration || 0));
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = DEFAULT_VOLUME;

    const syncDuration = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setLoadError(null);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleError = () => {
      setLoadError("Track unavailable");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    syncDuration();
    void attemptPlayback();

    return () => {
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [attemptPlayback]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!requiresInteraction) {
      return;
    }

    const unlockPlayback = () => {
      void attemptPlayback();
    };

    window.addEventListener("pointerdown", unlockPlayback, true);
    window.addEventListener("keydown", unlockPlayback, true);

    return () => {
      window.removeEventListener("pointerdown", unlockPlayback, true);
      window.removeEventListener("keydown", unlockPlayback, true);
    };
  }, [attemptPlayback, requiresInteraction]);

  const handleTogglePlayback = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void attemptPlayback();
      return;
    }

    audio.pause();
  }, [attemptPlayback]);

  const handleSeekChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAudioTime(Number(event.target.value));
  }, [setAudioTime]);

  const handleRestart = useCallback(() => {
    setAudioTime(0);
  }, [setAudioTime]);

  const handleJumpBackward = useCallback(() => {
    const audio = audioRef.current;
    setAudioTime((audio?.currentTime ?? currentTime) - SEEK_STEP_SECONDS);
  }, [currentTime, setAudioTime]);

  const handleJumpForward = useCallback(() => {
    const audio = audioRef.current;
    setAudioTime((audio?.currentTime ?? currentTime) + SEEK_STEP_SECONDS);
  }, [currentTime, setAudioTime]);

  const handleCyclePlaybackRate = useCallback(() => {
    setPlaybackRate((currentRate) => {
      const currentIndex = PLAYBACK_RATES.indexOf(currentRate);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % PLAYBACK_RATES.length : 1;
      return PLAYBACK_RATES[nextIndex];
    });
  }, []);

  const controlsDisabled = Boolean(loadError) || duration <= 0;
  const seekValue = duration > 0 ? Math.min(currentTime, duration) : 0;
  const statusLabel = loadError
    ? "Track unavailable"
    : requiresInteraction
      ? "Tap play to start"
      : isPlaying
        ? "Now playing"
        : "Paused";
  const statusToneClass = loadError
    ? "background-music-player__status--error"
    : requiresInteraction
      ? "background-music-player__status--prompt"
      : isPlaying
        ? "background-music-player__status--playing"
        : "background-music-player__status--paused";

  return (
    <div
      className="background-music-player"
      aria-label="Background music player"
      style={{ ["--ui-scale" as string]: uiScale.toString() } as CSSProperties}
    >
      <audio ref={audioRef} src={TRACK_SOURCE} loop preload="auto" />
      <div className="background-music-player__body">
        <div className="background-music-player__copy">
          <span className="background-music-player__eyebrow">Background Music</span>
          <strong className="background-music-player__title">Risk It All</strong>
          <span className="background-music-player__artist">Bruno Mars</span>
          <span className="background-music-player__path" title={TRACK_PATH_LABEL}>{TRACK_PATH_LABEL}</span>
        </div>
        <div className="background-music-player__meta">
          <span className={`background-music-player__status ${statusToneClass}`}>{statusLabel}</span>
          <span className="background-music-player__rate">{formatPlaybackRate(playbackRate)}</span>
        </div>
        <div className="background-music-player__scrub">
          <span className="background-music-player__scrub-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="background-music-player__seek"
            min={0}
            max={duration || 0}
            step={0.1}
            value={seekValue}
            onChange={handleSeekChange}
            disabled={controlsDisabled}
            aria-label="Seek through background music"
          />
          <span className="background-music-player__scrub-time">{formatTime(duration)}</span>
        </div>
        <div className="background-music-player__transport" role="group" aria-label="Music controls">
          <button
            type="button"
            className="background-music-player__transport-button"
            onClick={handleRestart}
            disabled={controlsDisabled}
            title="Restart track"
            aria-label="Restart track"
          >
            |&lt;
          </button>
          <button
            type="button"
            className="background-music-player__transport-button"
            onClick={handleJumpBackward}
            disabled={controlsDisabled}
            title="Back 10 seconds"
            aria-label="Back 10 seconds"
          >
            &lt;&lt;
          </button>
          <button
            type="button"
            className="background-music-player__transport-button background-music-player__transport-button--primary"
            onClick={handleTogglePlayback}
            disabled={Boolean(loadError)}
            title={isPlaying ? "Pause background music" : "Play background music"}
            aria-label={isPlaying ? "Pause background music" : "Play background music"}
          >
            {isPlaying ? "||" : ">"}
          </button>
          <button
            type="button"
            className="background-music-player__transport-button"
            onClick={handleJumpForward}
            disabled={controlsDisabled}
            title="Forward 10 seconds"
            aria-label="Forward 10 seconds"
          >
            &gt;&gt;
          </button>
          <button
            type="button"
            className="background-music-player__transport-button"
            onClick={handleCyclePlaybackRate}
            disabled={Boolean(loadError)}
            title="Change playback speed"
            aria-label="Change playback speed"
          >
            {formatPlaybackRate(playbackRate)}
          </button>
        </div>
      </div>
      <button
        type="button"
        className={`background-music-player__disc-button${isPlaying ? " background-music-player__disc-button--playing" : ""}`}
        onClick={handleTogglePlayback}
        disabled={Boolean(loadError)}
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
        title={isPlaying ? "Pause background music" : "Play background music"}
      >
        <span className="background-music-player__disc-surface" aria-hidden="true" />
        <span className="background-music-player__disc-core" aria-hidden="true">
          <span className="background-music-player__disc-icon">{isPlaying ? "||" : ">"}</span>
        </span>
      </button>
    </div>
  );
}