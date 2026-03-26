import { useEffect, useRef, useState } from "react";
import {
  PC_MINIGAME_SESSION_MS,
  formatPcMinigameCooldown,
  getPcMinigameCooldownRemaining,
  getPcMinigameRewardCoins,
  type PcMinigameProgress,
  type PcMinigameResult
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
  scale: number;
  expiresAt: number;
};

const GOOD_TARGETS: TargetVariant[] = [
  { label: "Gig", value: 2, lifetimeMs: 1450, tone: "good" },
  { label: "Tip", value: 1, lifetimeMs: 1350, tone: "good" },
  { label: "Bonus", value: 3, lifetimeMs: 1200, tone: "bonus" }
];

const BAD_TARGETS: TargetVariant[] = [
  { label: "Spam", value: -2, lifetimeMs: 1500, tone: "bad" },
  { label: "Virus", value: -3, lifetimeMs: 1250, tone: "bad" }
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createTarget(id: number, now: number): PcTarget {
  const sourcePool = Math.random() < 0.74 ? GOOD_TARGETS : BAD_TARGETS;
  const variant = sourcePool[Math.floor(Math.random() * sourcePool.length)];

  return {
    ...variant,
    id,
    xPercent: randomBetween(12, 84),
    yPercent: randomBetween(18, 82),
    scale: randomBetween(0.92, 1.12),
    expiresAt: now + variant.lifetimeMs
  };
}

export interface PcMinigameOverlayProps {
  currentCoins: number;
  dailyRitualBonusCoins?: number;
  dailyRitualBonusXp?: number;
  dailyRitualStatus?: string | null;
  progress: PcMinigameProgress;
  onComplete: (result: PcMinigameResult) => void;
  onExit: () => void;
  streakCount?: number;
}

export function PcMinigameOverlay({
  currentCoins,
  dailyRitualBonusCoins = 0,
  dailyRitualBonusXp = 0,
  dailyRitualStatus = null,
  progress,
  onComplete,
  onExit,
  streakCount = 0
}: PcMinigameOverlayProps) {
  const [status, setStatus] = useState<"idle" | "running" | "results">("idle");
  const [targets, setTargets] = useState<PcTarget[]>([]);
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastRewardCoins, setLastRewardCoins] = useState(progress.lastRewardCoins);
  const [lastRunScore, setLastRunScore] = useState(progress.lastScore);
  const nextTargetIdRef = useRef(1);

  const cooldownRemainingMs = getPcMinigameCooldownRemaining(progress.lastCompletedAt, nowMs);
  const isCoolingDown = cooldownRemainingMs > 0;
  const remainingSessionMs =
    status === "running" && sessionEndsAt !== null ? Math.max(0, sessionEndsAt - nowMs) : 0;
  const accuracy =
    hits + mistakes > 0 ? Math.round((hits / (hits + mistakes)) * 100) : 100;
  const beatBestScore =
    status === "results" && lastRunScore > 0 && lastRunScore >= progress.bestScore;

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onExit]);

  useEffect(() => {
    if (status !== "running" || sessionEndsAt === null) {
      return;
    }

    const spawnIntervalId = window.setInterval(() => {
      const now = Date.now();

      setTargets((currentTargets) => {
        const aliveTargets = currentTargets.filter((target) => target.expiresAt > now);

        if (aliveTargets.length >= 4) {
          return aliveTargets;
        }

        const nextTargets = [...aliveTargets, createTarget(nextTargetIdRef.current, now)];
        nextTargetIdRef.current += 1;

        if (aliveTargets.length <= 1 && Math.random() < 0.32) {
          nextTargets.push(createTarget(nextTargetIdRef.current, now));
          nextTargetIdRef.current += 1;
        }

        return nextTargets;
      });
    }, 430);

    const pruneIntervalId = window.setInterval(() => {
      const now = Date.now();
      setTargets((currentTargets) => currentTargets.filter((target) => target.expiresAt > now));
    }, 140);

    return () => {
      window.clearInterval(spawnIntervalId);
      window.clearInterval(pruneIntervalId);
    };
  }, [sessionEndsAt, status]);

  useEffect(() => {
    if (status !== "running" || sessionEndsAt === null || remainingSessionMs > 0) {
      return;
    }

    const completedAt = Date.now();
    const rewardCoins = getPcMinigameRewardCoins(score);

    setStatus("results");
    setTargets([]);
    setLastRewardCoins(rewardCoins);
    setLastRunScore(score);
    onComplete({
      score,
      rewardCoins,
      completedAt
    });
  }, [onComplete, remainingSessionMs, score, sessionEndsAt, status]);

  function handleStartRun() {
    if (isCoolingDown) {
      return;
    }

    setStatus("running");
    setTargets([]);
    setScore(0);
    setHits(0);
    setMistakes(0);
    setLastRewardCoins(0);
    setLastRunScore(0);
    setSessionEndsAt(Date.now() + PC_MINIGAME_SESSION_MS);
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

  function handleBoardMiss() {
    if (status !== "running") {
      return;
    }

    setScore((currentScore) => Math.max(0, currentScore - 1));
    setMistakes((currentMistakes) => currentMistakes + 1);
  }

  return (
    <div className="pc-minigame">
      <div className="pc-minigame__panel" role="dialog" aria-modal="true" aria-label="Desk PC minigame">
        <div className="pc-minigame__header">
          <div>
            <p className="pc-minigame__eyebrow">Desk PC</p>
            <h2 className="pc-minigame__title">Pixel Gigs</h2>
            <p className="pc-minigame__subtitle">
              Click paying pings, dodge the bad popups, and cash out before the shift ends.
            </p>
          </div>
          <button className="pc-minigame__close" onClick={onExit} type="button">
            Back to room
          </button>
        </div>

        <div className="pc-minigame__stats">
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Wallet</span>
            <strong>{currentCoins} coins</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Best</span>
            <strong>{progress.bestScore}</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Games</span>
            <strong>{progress.gamesPlayed}</strong>
          </div>
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Cooldown</span>
            <strong>
              {isCoolingDown ? formatPcMinigameCooldown(cooldownRemainingMs) : "Ready"}
            </strong>
          </div>
        </div>

        <div className="pc-minigame__monitor">
          <div className="pc-minigame__hud">
            <span>Score {score}</span>
            <span>
              Time {status === "running" ? (remainingSessionMs / 1000).toFixed(1) : "25.0"}s
            </span>
            <span>Accuracy {accuracy}%</span>
          </div>

          <div
            className={`pc-minigame__board pc-minigame__board--${status}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                handleBoardMiss();
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
                style={{
                  left: `${target.xPercent}%`,
                  top: `${target.yPercent}%`,
                  transform: `translate(-50%, -50%) scale(${target.scale})`
                }}
                type="button"
              >
                <span className="pc-minigame__target-label">{target.label}</span>
                <span className="pc-minigame__target-value">
                  {target.value > 0 ? `+${target.value}` : target.value}
                </span>
              </button>
            ))}

            {status === "idle" ? (
              <div className="pc-minigame__card">
                <h3>Clock in</h3>
                <p>
                  Each run lasts 25 seconds. Good pings add coins to your score. Spam and virus
                  popups drag it down.
                </p>
                <ul className="pc-minigame__rules">
                  <li>Good pings add 1 to 3 score.</li>
                  <li>Bad popups subtract score if you click them.</li>
                  <li>Miss-clicking the desktop costs 1 score.</li>
                </ul>
                <button
                  className="pc-minigame__primary"
                  disabled={isCoolingDown}
                  onClick={handleStartRun}
                  type="button"
                >
                  {isCoolingDown
                    ? `Cooling down ${formatPcMinigameCooldown(cooldownRemainingMs)}`
                    : "Start shift"}
                </button>
              </div>
            ) : null}

            {status === "results" ? (
              <div className="pc-minigame__card">
                <h3>Shift complete</h3>
                <p>
                  You scored <strong>{lastRunScore}</strong> and earned{" "}
                  <strong>{lastRewardCoins}</strong> coins.
                </p>
                <div className="pc-minigame__result-row">
                  <span>All-time best</span>
                  <strong>{progress.bestScore}</strong>
                </div>
                <div className="pc-minigame__result-row">
                  <span>Total PC coins earned</span>
                  <strong>{progress.totalCoinsEarned}</strong>
                </div>
                <div className="pc-minigame__result-row">
                  <span>Status</span>
                  <strong>{beatBestScore ? "New best" : "Cooldown live"}</strong>
                </div>
                {dailyRitualStatus ? (
                  <>
                    <div className="pc-minigame__result-row">
                      <span>Daily ritual</span>
                      <strong>{dailyRitualStatus}</strong>
                    </div>
                    <div className="pc-minigame__result-row">
                      <span>Daily bonus</span>
                      <strong>
                        {dailyRitualBonusCoins > 0 || dailyRitualBonusXp > 0
                          ? `+${dailyRitualBonusCoins} coins / +${dailyRitualBonusXp} XP for both partners`
                          : "Not earned yet"}
                      </strong>
                    </div>
                    <div className="pc-minigame__result-row">
                      <span>Streak</span>
                      <strong>{streakCount}</strong>
                    </div>
                  </>
                ) : null}
                <button className="pc-minigame__primary" onClick={onExit} type="button">
                  Back to room
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <p className="pc-minigame__footer">
          Press <kbd>Esc</kbd> or use Back to room to leave the desk.
        </p>
      </div>
    </div>
  );
}
