import { useEffect, useMemo, useRef, useState } from "react";
import {
  PC_MINIGAME_SESSION_MS,
  getPcDeskAppDefinitions,
  getPcDeskRewardCoins,
  type PcDeskActivityId,
  type PcDeskAppDefinition,
  type PcDeskRunResult,
  type PcMinigameProgress
} from "../lib/pcMinigame";

type TargetTone = "good" | "bonus" | "bad";

type TargetVariant = {
  label: string;
  value: number;
  lifetimeMs: number;
  tone: TargetTone;
};

type PcTarget = TargetVariant & {
  id: number;
  xPercent: number;
  yPercent: number;
  expiresAt: number;
};

const DESKTOP_SHORTCUT_LABELS: Record<PcDeskActivityId, "Snake" | "Block Stacker" | "Runner"> = {
  pc_snake: "Snake",
  pc_block_stacker: "Block Stacker",
  pc_runner: "Runner"
};

const APP_TARGET_VARIANTS: Record<PcDeskActivityId, readonly TargetVariant[]> = {
  pc_snake: [
    { label: "Fruit", value: 2, lifetimeMs: 1450, tone: "good" },
    { label: "Byte", value: 1, lifetimeMs: 1300, tone: "good" },
    { label: "Crash", value: -2, lifetimeMs: 1350, tone: "bad" }
  ],
  pc_block_stacker: [
    { label: "Line", value: 3, lifetimeMs: 1200, tone: "bonus" },
    { label: "Stack", value: 2, lifetimeMs: 1350, tone: "good" },
    { label: "Jam", value: -2, lifetimeMs: 1400, tone: "bad" }
  ],
  pc_runner: [
    { label: "Stride", value: 2, lifetimeMs: 1150, tone: "good" },
    { label: "Boost", value: 3, lifetimeMs: 1050, tone: "bonus" },
    { label: "Cactus", value: -3, lifetimeMs: 1300, tone: "bad" }
  ]
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createTarget(activityId: PcDeskActivityId, id: number, now: number): PcTarget {
  const variants = APP_TARGET_VARIANTS[activityId];
  const variant = variants[Math.floor(Math.random() * variants.length)];

  return {
    ...variant,
    id,
    xPercent: randomBetween(14, 84),
    yPercent: randomBetween(18, 80),
    expiresAt: now + variant.lifetimeMs
  };
}

export interface PcMinigameOverlayProps {
  currentCoins: number;
  dailyRitualBonusCoins?: number;
  dailyRitualBonusXp?: number;
  dailyRitualStatus?: string | null;
  paidTodayByActivityId?: Partial<Record<PcDeskActivityId, boolean>>;
  progress: PcMinigameProgress;
  onComplete: (result: PcDeskRunResult) => void;
  onExit: () => void;
  streakCount?: number;
}

export function PcMinigameOverlay({
  currentCoins,
  dailyRitualBonusCoins = 0,
  dailyRitualBonusXp = 0,
  dailyRitualStatus = null,
  paidTodayByActivityId = {},
  progress,
  onComplete,
  onExit,
  streakCount = 0
}: PcMinigameOverlayProps) {
  const appDefinitions = useMemo(() => getPcDeskAppDefinitions(), []);
  const [activeAppId, setActiveAppId] = useState<PcDeskActivityId | null>(null);
  const [status, setStatus] = useState<"desktop" | "ready" | "running" | "results">("desktop");
  const [targets, setTargets] = useState<PcTarget[]>([]);
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastRun, setLastRun] = useState<PcDeskRunResult | null>(null);
  const [lastRunWasPaid, setLastRunWasPaid] = useState(false);
  const nextTargetIdRef = useRef(1);

  const activeApp = appDefinitions.find((definition) => definition.id === activeAppId) ?? null;
  const paidToday = activeAppId ? Boolean(paidTodayByActivityId[activeAppId]) : false;
  const remainingSessionMs =
    status === "running" && sessionEndsAt !== null ? Math.max(0, sessionEndsAt - nowMs) : 0;
  const accuracy = hits + mistakes > 0 ? Math.round((hits / (hits + mistakes)) * 100) : 100;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onExit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  useEffect(() => {
    if (status !== "running" || sessionEndsAt === null || !activeAppId) {
      return;
    }

    const spawnIntervalId = window.setInterval(() => {
      const now = Date.now();
      setTargets((currentTargets) => {
        const aliveTargets = currentTargets.filter((target) => target.expiresAt > now);
        if (aliveTargets.length >= 4) {
          return aliveTargets;
        }

        const nextTargets = [...aliveTargets, createTarget(activeAppId, nextTargetIdRef.current, now)];
        nextTargetIdRef.current += 1;
        return nextTargets;
      });
    }, 420);

    const pruneIntervalId = window.setInterval(() => {
      const now = Date.now();
      setTargets((currentTargets) => currentTargets.filter((target) => target.expiresAt > now));
    }, 120);

    return () => {
      window.clearInterval(spawnIntervalId);
      window.clearInterval(pruneIntervalId);
    };
  }, [activeAppId, sessionEndsAt, status]);

  useEffect(() => {
    if (status !== "running" || sessionEndsAt === null || remainingSessionMs > 0 || !activeAppId) {
      return;
    }

    const completedAt = Date.now();
    const rewardCoins = getPcDeskRewardCoins(activeAppId, score);
    const runResult: PcDeskRunResult = {
      activityId: activeAppId,
      score,
      rewardCoins,
      completedAt
    };

    setLastRun(runResult);
    setLastRunWasPaid(!paidToday);
    setStatus("results");
    setTargets([]);
    onComplete(runResult);
  }, [activeAppId, onComplete, paidToday, remainingSessionMs, score, sessionEndsAt, status]);

  function handleLaunchApp(activityId: PcDeskActivityId) {
    setActiveAppId(activityId);
    setTargets([]);
    setScore(0);
    setHits(0);
    setMistakes(0);
    setLastRun(null);
    setStatus("ready");
  }

  function handleStartRun() {
    if (!activeAppId) {
      return;
    }

    const now = Date.now();
    setTargets([createTarget(activeAppId, nextTargetIdRef.current, now)]);
    nextTargetIdRef.current += 1;
    setScore(0);
    setHits(0);
    setMistakes(0);
    setLastRun(null);
    setStatus("running");
    setSessionEndsAt(now + PC_MINIGAME_SESSION_MS);
  }

  function handleTargetClick(targetId: number) {
    if (status !== "running") {
      return;
    }

    const clickedTarget = targets.find((target) => target.id === targetId);
    if (!clickedTarget) {
      return;
    }

    if (clickedTarget.value > 0) {
      setScore((currentScore) => currentScore + clickedTarget.value);
      setHits((currentHits) => currentHits + 1);
    } else {
      setScore((currentScore) => Math.max(0, currentScore + clickedTarget.value));
      setMistakes((currentMistakes) => currentMistakes + 1);
    }

    setTargets((currentTargets) => currentTargets.filter((target) => target.id !== targetId));
  }

  function handleDesktopMiss() {
    if (status !== "running") {
      return;
    }

    setScore((currentScore) => Math.max(0, currentScore - 1));
    setMistakes((currentMistakes) => currentMistakes + 1);
  }

  function handleBackToDesktop() {
    setActiveAppId(null);
    setTargets([]);
    setSessionEndsAt(null);
    setStatus("desktop");
  }

  return (
    <div className="pc-minigame">
      <div
        className="pc-minigame__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Retro desk PC"
        style={{
          fontFamily: '"Courier New", "Lucida Console", monospace',
          borderRadius: 10,
          border: "3px solid #171717",
          boxShadow: "0 0 0 3px #d6d1bf, 20px 20px 0 rgba(0, 0, 0, 0.35)",
          background: "linear-gradient(180deg, #c8c4b8 0%, #b0ac9f 100%)",
          color: "#111"
        }}
      >
        <div className="pc-minigame__header">
          <div>
            <p className="pc-minigame__eyebrow" style={{ color: "#1e3155", fontFamily: 'inherit' }}>
              DESK PC
            </p>
            <h2 className="pc-minigame__title" style={{ color: "#111", fontFamily: 'inherit', fontSize: 28 }}>
              Cozy Desktop 95
            </h2>
            <p className="pc-minigame__subtitle" style={{ color: "#27303c", fontFamily: 'inherit' }}>
              Open an app, play a quick round, and keep the room feeling lived in.
            </p>
          </div>
          <button className="pc-minigame__close" onClick={onExit} type="button" style={{ fontFamily: 'inherit' }}>
            Exit PC
          </button>
        </div>

        <div className="pc-minigame__stats">
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Wallet</span>
            <strong>{currentCoins} coins</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Best run</span>
            <strong>{progress.bestScore}</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Games</span>
            <strong>{progress.gamesPlayed}</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Today</span>
            <strong>{activeAppId && paidToday ? "Practice" : "Reward live"}</strong>
          </div>
        </div>

        <div className="pc-minigame__monitor" style={{ borderRadius: 10, border: "3px solid #171717" }}>
          {status === "desktop" ? (
            <div className="pc-minigame__board pc-minigame__board--desktop" style={{ padding: 24 }}>
              <div className="pc-minigame__hud">
                <span>Desktop ready</span>
                <span>Pick one app</span>
                <span>Replay anytime</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                {appDefinitions.map((definition) => (
                  <button
                    key={definition.id}
                    className="pc-minigame__card"
                    onClick={() => handleLaunchApp(definition.id)}
                    type="button"
                    style={{ position: "relative", inset: "auto", transform: "none", width: "100%", fontFamily: 'inherit' }}
                  >
                    <h3 style={{ fontFamily: 'inherit', fontSize: 20 }}>{DESKTOP_SHORTCUT_LABELS[definition.id]}</h3>
                    <p>{definition.executableName}</p>
                    <p>{definition.intro}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {activeApp && status !== "desktop" ? (
            <div>
              <div className="pc-minigame__hud">
                <span>{activeApp.label}</span>
                <span>{activeApp.executableName}</span>
                <span>{status === "running" ? `Time ${(remainingSessionMs / 1000).toFixed(1)}s` : "Ready"}</span>
                <span>Accuracy {accuracy}%</span>
              </div>
              <div
                className={`pc-minigame__board pc-minigame__board--${status}`}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    handleDesktopMiss();
                  }
                }}
              >
                {targets.map((target) => (
                  <button
                    key={target.id}
                    className={`pc-minigame__target pc-minigame__target--${target.tone}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTargetClick(target.id);
                    }}
                    style={{ left: `${target.xPercent}%`, top: `${target.yPercent}%`, transform: "translate(-50%, -50%)" }}
                    type="button"
                  >
                    <span className="pc-minigame__target-label">{target.label}</span>
                    <span className="pc-minigame__target-value">{target.value > 0 ? `+${target.value}` : target.value}</span>
                  </button>
                ))}

                {status === "ready" ? (
                  <div className="pc-minigame__card">
                    <h3 style={{ fontFamily: 'inherit' }}>{activeApp.label}</h3>
                    <p>{activeApp.intro}</p>
                    <div className="pc-minigame__result-row">
                      <span>Payout</span>
                      <strong>{paidToday ? "Practice only" : "Reward available"}</strong>
                    </div>
                    <button className="pc-minigame__primary" onClick={handleStartRun} type="button" style={{ fontFamily: 'inherit' }}>
                      Run app
                    </button>
                    <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button" style={{ marginTop: 10, fontFamily: 'inherit' }}>
                      Back to desktop
                    </button>
                  </div>
                ) : null}

                {status === "results" && lastRun ? (
                  <div className="pc-minigame__card">
                    <h3 style={{ fontFamily: 'inherit' }}>{activeApp.label} results</h3>
                    <div className="pc-minigame__result-row">
                      <span>Status</span>
                      <strong>{lastRunWasPaid ? "Paid today" : "Practice run only"}</strong>
                    </div>
                    <div className="pc-minigame__result-row">
                      <span>Score</span>
                      <strong>{lastRun.score}</strong>
                    </div>
                    <div className="pc-minigame__result-row">
                      <span>Coins</span>
                      <strong>{lastRunWasPaid ? lastRun.rewardCoins : 0}</strong>
                    </div>
                    {dailyRitualStatus ? (
                      <div className="pc-minigame__result-row">
                        <span>Legacy ritual</span>
                        <strong>{dailyRitualStatus}</strong>
                      </div>
                    ) : null}
                    {dailyRitualBonusCoins > 0 || dailyRitualBonusXp > 0 ? (
                      <div className="pc-minigame__result-row">
                        <span>Bonus</span>
                        <strong>{`+${dailyRitualBonusCoins} / +${dailyRitualBonusXp}`}</strong>
                      </div>
                    ) : null}
                    <div className="pc-minigame__result-row">
                      <span>Streak</span>
                      <strong>{streakCount}</strong>
                    </div>
                    <button className="pc-minigame__primary" onClick={handleStartRun} type="button" style={{ fontFamily: 'inherit' }}>
                      Play again
                    </button>
                    <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button" style={{ marginTop: 10, fontFamily: 'inherit' }}>
                      Back to desktop
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <p className="pc-minigame__footer" style={{ color: "#27303c", fontFamily: 'inherit' }}>
          Press <kbd>Esc</kbd> to close the computer. Rewards refresh by room day, but every app stays replayable.
        </p>
      </div>
    </div>
  );
}

