import { useEffect, useMemo, useRef, useState } from "react";
import {
  PC_MINIGAME_SESSION_MS,
  getPcDeskAppDefinitions,
  getPcDeskRewardCoins,
  type PcDeskActivityId,
  type PcDeskRunResult,
  type PcMinigameProgress
} from "../lib/pcMinigame";

type Direction = "up" | "down" | "left" | "right";

type GridCell = {
  x: number;
  y: number;
};

type SnakeState = {
  snake: GridCell[];
  direction: Direction;
  queuedDirection: Direction | null;
  food: GridCell;
};

type StackerSlice = {
  row: number;
  start: number;
  width: number;
};

type StackerState = {
  activeRow: number;
  cursorStart: number;
  cursorDirection: -1 | 1;
  activeWidth: number;
  settled: StackerSlice[];
};

type RunnerObstacle = {
  id: number;
  x: number;
  height: number;
  passed: boolean;
};

type RunnerState = {
  runnerY: number;
  velocityY: number;
  obstacles: RunnerObstacle[];
  spawnCooldownMs: number;
  distance: number;
  collisionFlashMs: number;
};

const DESKTOP_SHORTCUT_LABELS: Record<PcDeskActivityId, "Snake" | "Block Stacker" | "Runner"> = {
  pc_snake: "Snake",
  pc_block_stacker: "Block Stacker",
  pc_runner: "Runner"
};

const SNAKE_GRID_SIZE = 10;
const SNAKE_TICK_MS = 220;
const BLOCK_STACKER_COLUMNS = 7;
const BLOCK_STACKER_ROWS = 6;
const BLOCK_STACKER_MOVE_MS = 125;
const RUNNER_TICK_MS = 80;
const RUNNER_PLAYER_X = 0.16;
const RUNNER_OBSTACLE_WIDTH = 0.1;
const RUNNER_SPEED = 0.72;
const RUNNER_GRAVITY = 14;
const RUNNER_JUMP_VELOCITY = 4.9;

function randomInt(max: number): number {
  return Math.max(0, Math.floor(Math.random() * max));
}

function cellsEqual(left: GridCell, right: GridCell): boolean {
  return left.x === right.x && left.y === right.y;
}

function createSnakeFood(snake: GridCell[]): GridCell {
  const openCells: GridCell[] = [];

  for (let y = 0; y < SNAKE_GRID_SIZE; y += 1) {
    for (let x = 0; x < SNAKE_GRID_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  return openCells[randomInt(openCells.length)] ?? { x: 0, y: 0 };
}

function createInitialSnakeState(): SnakeState {
  const snake = [
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 }
  ];

  return {
    snake,
    direction: "right",
    queuedDirection: null,
    food: createSnakeFood(snake)
  };
}

function isOppositeDirection(current: Direction, next: Direction): boolean {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

function getDirectionDelta(direction: Direction): GridCell {
  switch (direction) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
    default:
      return { x: 1, y: 0 };
  }
}

function createInitialStackerState(): StackerState {
  const activeWidth = 4;
  return {
    activeRow: BLOCK_STACKER_ROWS - 1,
    cursorStart: Math.floor((BLOCK_STACKER_COLUMNS - activeWidth) / 2),
    cursorDirection: 1,
    activeWidth,
    settled: []
  };
}

function createInitialRunnerState(): RunnerState {
  return {
    runnerY: 0,
    velocityY: 0,
    obstacles: [],
    spawnCooldownMs: 900,
    distance: 0,
    collisionFlashMs: 0
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastRun, setLastRun] = useState<PcDeskRunResult | null>(null);
  const [lastRunWasPaid, setLastRunWasPaid] = useState(false);
  const [snakeState, setSnakeState] = useState<SnakeState>(() => createInitialSnakeState());
  const [stackerState, setStackerState] = useState<StackerState>(() => createInitialStackerState());
  const [runnerState, setRunnerState] = useState<RunnerState>(() => createInitialRunnerState());
  const nextRunnerObstacleIdRef = useRef(1);

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
        return;
      }

      if (status !== "running" || !activeAppId) {
        return;
      }

      if (activeAppId === "pc_snake") {
        const directionByKey: Partial<Record<string, Direction>> = {
          ArrowUp: "up",
          KeyW: "up",
          ArrowDown: "down",
          KeyS: "down",
          ArrowLeft: "left",
          KeyA: "left",
          ArrowRight: "right",
          KeyD: "right"
        };
        const nextDirection = directionByKey[event.code] ?? directionByKey[event.key];
        if (nextDirection) {
          event.preventDefault();
          handleSnakeTurn(nextDirection);
        }
        return;
      }

      if (activeAppId === "pc_block_stacker") {
        if (event.code === "Space" || event.key === "Enter" || event.key === "ArrowDown") {
          event.preventDefault();
          handleStackerDrop();
        }
        return;
      }

      if (activeAppId === "pc_runner") {
        if (event.code === "Space" || event.key === "ArrowUp" || event.code === "KeyW") {
          event.preventDefault();
          handleRunnerJump();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAppId, onExit, runnerState, stackerState, status, snakeState.direction]);

  useEffect(() => {
    if (status !== "running" || activeAppId !== "pc_snake") {
      return;
    }

    const intervalId = window.setInterval(() => {
      let scoreDelta = 0;
      let hitCount = 0;
      let mistakeCount = 0;

      setSnakeState((currentState) => {
        const nextDirection =
          currentState.queuedDirection && !isOppositeDirection(currentState.direction, currentState.queuedDirection)
            ? currentState.queuedDirection
            : currentState.direction;
        const delta = getDirectionDelta(nextDirection);
        const currentHead = currentState.snake[0];
        const nextHead = { x: currentHead.x + delta.x, y: currentHead.y + delta.y };
        const collidesWithWall =
          nextHead.x < 0 ||
          nextHead.x >= SNAKE_GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= SNAKE_GRID_SIZE;
        const collidesWithSelf = currentState.snake.some((segment) => cellsEqual(segment, nextHead));

        if (collidesWithWall || collidesWithSelf) {
          scoreDelta = -2;
          mistakeCount = 1;
          return createInitialSnakeState();
        }

        const ateFood = cellsEqual(nextHead, currentState.food);
        const nextSnake = ateFood
          ? [nextHead, ...currentState.snake]
          : [nextHead, ...currentState.snake.slice(0, -1)];

        if (ateFood) {
          scoreDelta = 3;
          hitCount = 1;
        }

        return {
          snake: nextSnake,
          direction: nextDirection,
          queuedDirection: null,
          food: ateFood ? createSnakeFood(nextSnake) : currentState.food
        };
      });

      if (scoreDelta !== 0) {
        setScore((currentScore) => Math.max(0, currentScore + scoreDelta));
      }
      if (hitCount > 0) {
        setHits((currentHits) => currentHits + hitCount);
      }
      if (mistakeCount > 0) {
        setMistakes((currentMistakes) => currentMistakes + mistakeCount);
      }
    }, SNAKE_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeAppId, status]);

  useEffect(() => {
    if (status !== "running" || activeAppId !== "pc_block_stacker") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setStackerState((currentState) => {
        const maxStart = BLOCK_STACKER_COLUMNS - currentState.activeWidth;
        let nextStart = currentState.cursorStart + currentState.cursorDirection;
        let nextDirection = currentState.cursorDirection;

        if (nextStart <= 0) {
          nextStart = 0;
          nextDirection = 1;
        } else if (nextStart >= maxStart) {
          nextStart = maxStart;
          nextDirection = -1;
        }

        return {
          ...currentState,
          cursorStart: nextStart,
          cursorDirection: nextDirection
        };
      });
    }, BLOCK_STACKER_MOVE_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeAppId, status]);

  useEffect(() => {
    if (status !== "running" || activeAppId !== "pc_runner") {
      return;
    }

    const intervalId = window.setInterval(() => {
      let scoreDelta = 0;
      let hitCount = 0;
      let mistakeCount = 0;

      setRunnerState((currentState) => {
        const deltaSeconds = RUNNER_TICK_MS / 1000;
        let velocityY = currentState.velocityY;
        let runnerY = currentState.runnerY;

        if (runnerY > 0 || velocityY > 0) {
          velocityY -= RUNNER_GRAVITY * deltaSeconds;
          runnerY = Math.max(0, runnerY + velocityY * deltaSeconds);
          if (runnerY === 0 && velocityY < 0) {
            velocityY = 0;
          }
        }

        let spawnCooldownMs = currentState.spawnCooldownMs - RUNNER_TICK_MS;
        let obstacles = currentState.obstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - RUNNER_SPEED * deltaSeconds }))
          .filter((obstacle) => obstacle.x + RUNNER_OBSTACLE_WIDTH > -0.08);
        let collisionFlashMs = Math.max(0, currentState.collisionFlashMs - RUNNER_TICK_MS);

        if (spawnCooldownMs <= 0) {
          obstacles = [
            ...obstacles,
            {
              id: nextRunnerObstacleIdRef.current,
              x: 1.05,
              height: Math.random() > 0.5 ? 0.2 : 0.26,
              passed: false
            }
          ];
          nextRunnerObstacleIdRef.current += 1;
          spawnCooldownMs = 900 + Math.round(Math.random() * 550);
        }

        obstacles = obstacles.map((obstacle) => {
          if (!obstacle.passed && obstacle.x + RUNNER_OBSTACLE_WIDTH < RUNNER_PLAYER_X) {
            scoreDelta += 2;
            hitCount += 1;
            return {
              ...obstacle,
              passed: true
            };
          }

          return obstacle;
        });

        const collided =
          collisionFlashMs === 0 &&
          obstacles.some(
            (obstacle) =>
              obstacle.x < RUNNER_PLAYER_X + 0.05 &&
              obstacle.x + RUNNER_OBSTACLE_WIDTH > RUNNER_PLAYER_X - 0.04 &&
              runnerY < obstacle.height + 0.02
          );

        if (collided) {
          scoreDelta -= 2;
          mistakeCount += 1;
          obstacles = [];
          spawnCooldownMs = 850;
          velocityY = 0;
          runnerY = 0;
          collisionFlashMs = 420;
        }

        return {
          runnerY,
          velocityY,
          obstacles,
          spawnCooldownMs,
          distance: currentState.distance + RUNNER_SPEED * deltaSeconds,
          collisionFlashMs
        };
      });

      if (scoreDelta !== 0) {
        setScore((currentScore) => Math.max(0, currentScore + scoreDelta));
      }
      if (hitCount > 0) {
        setHits((currentHits) => currentHits + hitCount);
      }
      if (mistakeCount > 0) {
        setMistakes((currentMistakes) => currentMistakes + mistakeCount);
      }
    }, RUNNER_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeAppId, status]);

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
    onComplete(runResult);
  }, [activeAppId, onComplete, paidToday, remainingSessionMs, score, sessionEndsAt, status]);

  function resetMiniGames() {
    setSnakeState(createInitialSnakeState());
    setStackerState(createInitialStackerState());
    setRunnerState(createInitialRunnerState());
    nextRunnerObstacleIdRef.current = 1;
  }

  function handleLaunchApp(activityId: PcDeskActivityId) {
    setActiveAppId(activityId);
    setSessionEndsAt(null);
    setScore(0);
    setHits(0);
    setMistakes(0);
    setLastRun(null);
    resetMiniGames();
    setStatus("ready");
  }

  function handleStartRun() {
    if (!activeAppId) {
      return;
    }

    const now = Date.now();
    resetMiniGames();
    setScore(0);
    setHits(0);
    setMistakes(0);
    setLastRun(null);
    setStatus("running");
    setSessionEndsAt(now + PC_MINIGAME_SESSION_MS);
  }

  function handleSnakeTurn(nextDirection: Direction) {
    if (status !== "running" || activeAppId !== "pc_snake") {
      return;
    }

    setSnakeState((currentState) => {
      const basisDirection = currentState.queuedDirection ?? currentState.direction;
      if (isOppositeDirection(basisDirection, nextDirection)) {
        return currentState;
      }

      return {
        ...currentState,
        queuedDirection: nextDirection
      };
    });
  }

  function handleStackerDrop() {
    if (status !== "running" || activeAppId !== "pc_block_stacker") {
      return;
    }

    const currentState = stackerState;
    let placedStart = currentState.cursorStart;
    let placedWidth = currentState.activeWidth;
    const referenceSlice = currentState.settled[0] ?? null;

    if (referenceSlice) {
      const overlapStart = Math.max(currentState.cursorStart, referenceSlice.start);
      const overlapEnd = Math.min(
        currentState.cursorStart + currentState.activeWidth,
        referenceSlice.start + referenceSlice.width
      );
      const overlapWidth = overlapEnd - overlapStart;

      if (overlapWidth <= 0) {
        setStackerState(createInitialStackerState());
        setScore((currentScore) => Math.max(0, currentScore - 2));
        setMistakes((currentMistakes) => currentMistakes + 1);
        return;
      }

      placedStart = overlapStart;
      placedWidth = overlapWidth;
    }

    const placedSlice: StackerSlice = {
      row: currentState.activeRow,
      start: placedStart,
      width: placedWidth
    };
    const nextSettled = [placedSlice, ...currentState.settled];
    const completedTower = currentState.activeRow === 0;
    const scoreDelta = placedWidth + (completedTower ? 4 : 0);

    setStackerState(
      completedTower
        ? createInitialStackerState()
        : {
            activeRow: currentState.activeRow - 1,
            cursorStart: clampNumber(placedStart, 0, BLOCK_STACKER_COLUMNS - placedWidth),
            cursorDirection: currentState.cursorDirection,
            activeWidth: placedWidth,
            settled: nextSettled
          }
    );
    setScore((currentScore) => Math.max(0, currentScore + scoreDelta));
    setHits((currentHits) => currentHits + 1);
  }

  function handleRunnerJump() {
    if (status !== "running" || activeAppId !== "pc_runner") {
      return;
    }

    setRunnerState((currentState) => {
      if (currentState.runnerY > 0.02 || currentState.velocityY > 0) {
        return currentState;
      }

      return {
        ...currentState,
        velocityY: RUNNER_JUMP_VELOCITY
      };
    });
  }

  function handleBackToDesktop() {
    setActiveAppId(null);
    setSessionEndsAt(null);
    setLastRun(null);
    setStatus("desktop");
    resetMiniGames();
  }

  function renderReadyCard() {
    if (!activeApp) {
      return null;
    }

    const rulesByApp: Record<PcDeskActivityId, string> = {
      pc_snake: "Use arrow keys or the D-pad to turn. Eat byte-fruit, and crashes reset the snake.",
      pc_block_stacker: "Time the moving row and drop it with Space, Enter, or the button. Clean overlaps keep the tower alive.",
      pc_runner: "Jump with Space or Up. Clear each cactus to keep the evening run paying out."
    };

    return (
      <div className="pc-minigame__card">
        <h3 style={{ fontFamily: "inherit" }}>{activeApp.label}</h3>
        <p>{activeApp.intro}</p>
        <div className="pc-minigame__result-row">
          <span>Payout</span>
          <strong>{paidToday ? "Practice only" : "Reward available"}</strong>
        </div>
        <div className="pc-minigame__result-row">
          <span>How it plays</span>
          <strong style={{ maxWidth: 220, textAlign: "right" }}>{rulesByApp[activeApp.id]}</strong>
        </div>
        <button className="pc-minigame__primary" onClick={handleStartRun} type="button" style={{ fontFamily: "inherit" }}>
          Run app
        </button>
        <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button" style={{ marginTop: 10, fontFamily: "inherit" }}>
          Back to desktop
        </button>
      </div>
    );
  }

  function renderSnakeBoard() {
    return (
      <div style={{ display: "grid", gap: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", color: "#d9ffd9", fontFamily: "inherit" }}>
          <span>Guide the snake into fruit and avoid the walls.</span>
          <span>Length {snakeState.snake.length}</span>
        </div>
        <div
          aria-label="Snake grid"
          style={{
            width: "min(100%, 420px)",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: `repeat(${SNAKE_GRID_SIZE}, minmax(0, 1fr))`,
            gap: 4,
            aspectRatio: "1 / 1",
            padding: 10,
            background: "linear-gradient(180deg, #102312, #081008)",
            border: "3px solid #172217",
            boxShadow: "inset 0 0 0 2px rgba(120, 255, 148, 0.16)"
          }}
        >
          {Array.from({ length: SNAKE_GRID_SIZE * SNAKE_GRID_SIZE }, (_, index) => {
            const x = index % SNAKE_GRID_SIZE;
            const y = Math.floor(index / SNAKE_GRID_SIZE);
            const segmentIndex = snakeState.snake.findIndex((segment) => segment.x === x && segment.y === y);
            const isHead = segmentIndex === 0;
            const isBody = segmentIndex > 0;
            const isFood = snakeState.food.x === x && snakeState.food.y === y;

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 4,
                  background: isHead
                    ? "#b9ff73"
                    : isBody
                      ? "#4cc068"
                      : isFood
                        ? "#ffba70"
                        : "rgba(255, 255, 255, 0.04)",
                  color: isFood ? "#3a2100" : "#0a160a",
                  fontSize: 14,
                  fontWeight: 700,
                  minHeight: 0
                }}
              >
                {isHead ? "@" : isBody ? "o" : isFood ? "*" : ""}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 8, justifyContent: "center" }}>
          <button className="pc-minigame__primary" onClick={() => handleSnakeTurn("up")} type="button" style={{ fontFamily: "inherit", minWidth: 110 }}>
            Up
          </button>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="pc-minigame__primary" onClick={() => handleSnakeTurn("left")} type="button" style={{ fontFamily: "inherit", minWidth: 110 }}>
              Left
            </button>
            <button className="pc-minigame__primary" onClick={() => handleSnakeTurn("down")} type="button" style={{ fontFamily: "inherit", minWidth: 110 }}>
              Down
            </button>
            <button className="pc-minigame__primary" onClick={() => handleSnakeTurn("right")} type="button" style={{ fontFamily: "inherit", minWidth: 110 }}>
              Right
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderStackerBoard() {
    return (
      <div style={{ display: "grid", gap: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", color: "#fff0c2", fontFamily: "inherit" }}>
          <span>Drop the moving row before it drifts out of alignment.</span>
          <span>Stack height {stackerState.settled.length}</span>
        </div>
        <div
          aria-label="Block Stacker board"
          style={{
            width: "min(100%, 420px)",
            margin: "0 auto",
            display: "grid",
            gap: 6,
            padding: 12,
            background: "linear-gradient(180deg, #2a1e07, #110d03)",
            border: "3px solid #2f2409",
            boxShadow: "inset 0 0 0 2px rgba(255, 214, 138, 0.14)"
          }}
        >
          {Array.from({ length: BLOCK_STACKER_ROWS }, (_, rowIndex) => {
            const settledSlice = stackerState.settled.find((slice) => slice.row === rowIndex) ?? null;
            const isActiveRow = rowIndex === stackerState.activeRow;

            return (
              <div
                key={`row-${rowIndex}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${BLOCK_STACKER_COLUMNS}, minmax(0, 1fr))`,
                  gap: 6
                }}
              >
                {Array.from({ length: BLOCK_STACKER_COLUMNS }, (_, columnIndex) => {
                  const isSettled =
                    settledSlice !== null &&
                    columnIndex >= settledSlice.start &&
                    columnIndex < settledSlice.start + settledSlice.width;
                  const isActive =
                    isActiveRow &&
                    columnIndex >= stackerState.cursorStart &&
                    columnIndex < stackerState.cursorStart + stackerState.activeWidth;

                  return (
                    <div
                      key={`row-${rowIndex}-column-${columnIndex}`}
                      style={{
                        aspectRatio: "1 / 1",
                        borderRadius: 4,
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        background: isActive
                          ? "#ffd06c"
                          : isSettled
                            ? "#f49d43"
                            : "rgba(255, 255, 255, 0.05)",
                        boxShadow: isActive ? "0 0 16px rgba(255, 208, 108, 0.45)" : "none"
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className="pc-minigame__primary" onClick={handleStackerDrop} type="button" style={{ fontFamily: "inherit", minWidth: 180 }}>
            Drop block
          </button>
        </div>
      </div>
    );
  }

  function renderRunnerBoard() {
    return (
      <div style={{ display: "grid", gap: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", color: "#d8f6ff", fontFamily: "inherit" }}>
          <span>Jump the cacti and keep the sunset sprint rolling.</span>
          <span>Distance {Math.floor(runnerState.distance * 10)}m</span>
        </div>
        <div
          aria-label="Runner track"
          style={{
            position: "relative",
            width: "min(100%, 460px)",
            height: 240,
            margin: "0 auto",
            overflow: "hidden",
            background:
              runnerState.collisionFlashMs > 0
                ? "linear-gradient(180deg, #3d1515, #170707)"
                : "linear-gradient(180deg, #13374c, #08131d)",
            border: "3px solid #173142",
            boxShadow: "inset 0 0 0 2px rgba(125, 214, 255, 0.14)"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto 0 0 0",
              height: 54,
              background: "repeating-linear-gradient(90deg, #62411a 0, #62411a 28px, #4f3415 28px, #4f3415 56px)"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${RUNNER_PLAYER_X * 100}%`,
              bottom: `${54 + runnerState.runnerY * 90}px`,
              width: 34,
              height: 46,
              marginLeft: -12,
              border: "3px solid #dcebf0",
              background: "#76d8ff",
              boxShadow: "0 0 0 3px rgba(9, 15, 22, 0.45)"
            }}
          />
          {runnerState.obstacles.map((obstacle) => (
            <div
              key={obstacle.id}
              style={{
                position: "absolute",
                left: `${obstacle.x * 100}%`,
                bottom: 54,
                width: `${RUNNER_OBSTACLE_WIDTH * 100}%`,
                maxWidth: 44,
                height: `${80 + obstacle.height * 80}px`,
                border: "3px solid #193523",
                background: obstacle.passed ? "#49765a" : "#79bc7b"
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className="pc-minigame__primary" onClick={handleRunnerJump} type="button" style={{ fontFamily: "inherit", minWidth: 180 }}>
            Jump
          </button>
        </div>
      </div>
    );
  }

  function renderRunningBoard() {
    if (!activeApp) {
      return null;
    }

    switch (activeApp.id) {
      case "pc_snake":
        return renderSnakeBoard();
      case "pc_block_stacker":
        return renderStackerBoard();
      case "pc_runner":
        return renderRunnerBoard();
      default:
        return null;
    }
  }

  const activityStatusLabel =
    activeAppId === "pc_snake"
      ? `Length ${snakeState.snake.length}`
      : activeAppId === "pc_block_stacker"
        ? `Stack ${stackerState.settled.length}/${BLOCK_STACKER_ROWS}`
        : activeAppId === "pc_runner"
          ? `Distance ${Math.floor(runnerState.distance * 10)}m`
          : "Ready";

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
            <p className="pc-minigame__eyebrow" style={{ color: "#1e3155", fontFamily: "inherit" }}>
              DESK PC
            </p>
            <h2 className="pc-minigame__title" style={{ color: "#111", fontFamily: "inherit", fontSize: 28 }}>
              Cozy Desktop 95
            </h2>
            <p className="pc-minigame__subtitle" style={{ color: "#27303c", fontFamily: "inherit" }}>
              Open an app, play a quick round, and keep the room feeling lived in.
            </p>
          </div>
          <button className="pc-minigame__close" onClick={onExit} type="button" style={{ fontFamily: "inherit" }}>
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
                    style={{ position: "relative", inset: "auto", transform: "none", width: "100%", fontFamily: "inherit" }}
                  >
                    <h3 style={{ fontFamily: "inherit", fontSize: 20 }}>{DESKTOP_SHORTCUT_LABELS[definition.id]}</h3>
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
                <span>Score {score}</span>
                <span>Accuracy {accuracy}%</span>
                <span>{activityStatusLabel}</span>
              </div>
              <div className={`pc-minigame__board pc-minigame__board--${status}`}>
                {status === "ready" ? renderReadyCard() : null}
                {status === "running" ? (
                  <div>
                    {renderRunningBoard()}
                    <div style={{ display: "flex", justifyContent: "center", paddingBottom: 18 }}>
                      <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button" style={{ fontFamily: "inherit" }}>
                        Back to desktop
                      </button>
                    </div>
                  </div>
                ) : null}

                {status === "results" && lastRun ? (
                  <div className="pc-minigame__card">
                    <h3 style={{ fontFamily: "inherit" }}>{activeApp.label} results</h3>
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
                      <span>Together Days</span>
                      <strong>{streakCount}</strong>
                    </div>
                    <button className="pc-minigame__primary" onClick={handleStartRun} type="button" style={{ fontFamily: "inherit" }}>
                      Play again
                    </button>
                    <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button" style={{ marginTop: 10, fontFamily: "inherit" }}>
                      Back to desktop
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <p className="pc-minigame__footer" style={{ color: "#27303c", fontFamily: "inherit" }}>
          Press <kbd>Esc</kbd> to close the computer. Rewards refresh by room day, but every app stays replayable.
        </p>
      </div>
    </div>
  );
}



