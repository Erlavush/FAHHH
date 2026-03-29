import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PC_MINIGAME_SESSION_MS,
  getPcDeskAppDefinitions,
  getPcDeskRewardCoins,
  type PcDeskActivityId,
  type PcDeskRunResult,
  type PcMinigameProgress
} from "../lib/pcMinigame";
import { PcPacmanBoard, type PcPacmanBoardStats } from "./pc-minigame/PcPacmanBoard";
import "./pc-minigame-snake.css";

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

const DESKTOP_SHORTCUT_LABELS: Record<PcDeskActivityId, "Snake" | "Block Stacker" | "Pacman"> = {
  pc_snake: "Snake",
  pc_block_stacker: "Block Stacker",
  pc_pacman: "Pacman"
};

const DESKTOP_SHORTCUT_BADGES: Record<PcDeskActivityId, "SNA" | "BLK" | "PAC"> = {
  pc_snake: "SNA",
  pc_block_stacker: "BLK",
  pc_pacman: "PAC"
};

const SNAKE_GRID_SIZE = 20;
const RETRO_SNAKE_CANVAS_SIZE = 400;
const RETRO_SNAKE_CELL_SIZE = RETRO_SNAKE_CANVAS_SIZE / SNAKE_GRID_SIZE;
const RETRO_SNAKE_BASE_FPS = 10;
const RETRO_SNAKE_BODY_COLORS = ["#B4ECED", "#81DDDF", "#46C5CA", "#2AA8B0"] as const;
const RETRO_SNAKE_HEAD_COLOR = "#265B64";
const RETRO_SNAKE_APPLE_COLOR = "#f4c0c0";
const RETRO_SNAKE_BACKGROUND_COLOR = "#111111";
const RETRO_SNAKE_GRID_COLOR = "rgba(192, 240, 244, 0.08)";
const RETRO_SNAKE_BORDER_COLOR = "#c0f0f4";
const BLOCK_STACKER_COLUMNS = 7;
const BLOCK_STACKER_ROWS = 6;
const BLOCK_STACKER_MOVE_MS = 125;

function createDefaultPacmanBoardStats(): PcPacmanBoardStats {
  return {
    frightenedActive: false,
    hits: 0,
    lives: 3,
    mistakes: 0,
    pelletsRemaining: 0,
    score: 0
  };
}

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
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
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


function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getRetroSnakeSpeed(score: number): number {
  return RETRO_SNAKE_BASE_FPS + score * 0.5;
}

function formatRetroSnakeSpeed(score: number): string {
  return `${(getRetroSnakeSpeed(score) / RETRO_SNAKE_BASE_FPS).toFixed(2)}x`;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) {
  context.fillStyle = fillColor;
  context.beginPath();

  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
    context.fill();
    return;
  }

  context.fillRect(x, y, width, height);
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
  const [pacmanStats, setPacmanStats] = useState<PcPacmanBoardStats>(() =>
    createDefaultPacmanBoardStats()
  );
  const snakeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeApp = appDefinitions.find((definition) => definition.id === activeAppId) ?? null;
  const paidToday = activeAppId ? Boolean(paidTodayByActivityId[activeAppId]) : false;
  const remainingSessionMs =
    status === "running" && sessionEndsAt !== null ? Math.max(0, sessionEndsAt - nowMs) : 0;
  const accuracy = hits + mistakes > 0 ? Math.round((hits / (hits + mistakes)) * 100) : 100;
  const snakeBestScore = Math.max(progress.bestScore, score);
  const snakeSpeedLabel = formatRetroSnakeSpeed(score);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (activeAppId !== "pc_snake") {
      return;
    }

    const canvas = snakeCanvasRef.current;

    if (!canvas) {
      return;
    }

    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas.getContext("2d");
    } catch {
      return;
    }

    if (!context) {
      return;
    }

    context.clearRect(0, 0, RETRO_SNAKE_CANVAS_SIZE, RETRO_SNAKE_CANVAS_SIZE);
    context.fillStyle = RETRO_SNAKE_BACKGROUND_COLOR;
    context.fillRect(0, 0, RETRO_SNAKE_CANVAS_SIZE, RETRO_SNAKE_CANVAS_SIZE);

    context.strokeStyle = RETRO_SNAKE_GRID_COLOR;
    context.lineWidth = 1;

    for (let offset = RETRO_SNAKE_CELL_SIZE; offset < RETRO_SNAKE_CANVAS_SIZE; offset += RETRO_SNAKE_CELL_SIZE) {
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, RETRO_SNAKE_CANVAS_SIZE);
      context.stroke();

      context.beginPath();
      context.moveTo(0, offset);
      context.lineTo(RETRO_SNAKE_CANVAS_SIZE, offset);
      context.stroke();
    }

    const foodInset = 3;
    drawRoundedRect(
      context,
      snakeState.food.x * RETRO_SNAKE_CELL_SIZE + foodInset,
      snakeState.food.y * RETRO_SNAKE_CELL_SIZE + foodInset,
      RETRO_SNAKE_CELL_SIZE - foodInset * 2,
      RETRO_SNAKE_CELL_SIZE - foodInset * 2,
      6,
      RETRO_SNAKE_APPLE_COLOR
    );

    for (let index = snakeState.snake.length - 1; index >= 1; index -= 1) {
      const segment = snakeState.snake[index];
      const inset = 2.5;
      drawRoundedRect(
        context,
        segment.x * RETRO_SNAKE_CELL_SIZE + inset,
        segment.y * RETRO_SNAKE_CELL_SIZE + inset,
        RETRO_SNAKE_CELL_SIZE - inset * 2,
        RETRO_SNAKE_CELL_SIZE - inset * 2,
        6,
        RETRO_SNAKE_BODY_COLORS[index % RETRO_SNAKE_BODY_COLORS.length]
      );
    }

    const head = snakeState.snake[0];
    const headInset = 2.5;
    drawRoundedRect(
      context,
      head.x * RETRO_SNAKE_CELL_SIZE + headInset,
      head.y * RETRO_SNAKE_CELL_SIZE + headInset,
      RETRO_SNAKE_CELL_SIZE - headInset * 2,
      RETRO_SNAKE_CELL_SIZE - headInset * 2,
      6,
      RETRO_SNAKE_HEAD_COLOR
    );

    context.strokeStyle = RETRO_SNAKE_BORDER_COLOR;
    context.lineWidth = 2;
    context.strokeRect(1, 1, RETRO_SNAKE_CANVAS_SIZE - 2, RETRO_SNAKE_CANVAS_SIZE - 2);
  }, [activeAppId, snakeState]);

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

    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAppId, onExit, status]);

  useEffect(() => {
    if (status !== "running" || activeAppId !== "pc_snake") {
      return;
    }

    const tickMs = Math.max(55, 1000 / getRetroSnakeSpeed(score));
    const intervalId = window.setInterval(() => {
      let nextScore: number | null = null;
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
        const ateFood = cellsEqual(nextHead, currentState.food);
        const bodyToCheck = ateFood ? currentState.snake : currentState.snake.slice(0, -1);
        const collidesWithSelf = bodyToCheck.some((segment) => cellsEqual(segment, nextHead));

        if (collidesWithWall || collidesWithSelf) {
          nextScore = 0;
          mistakeCount = 1;
          return createInitialSnakeState();
        }

        const nextSnake = ateFood
          ? [nextHead, ...currentState.snake]
          : [nextHead, ...currentState.snake.slice(0, -1)];

        if (ateFood) {
          nextScore = nextSnake.length - 1;
          hitCount = 1;
        }

        return {
          snake: nextSnake,
          direction: nextDirection,
          queuedDirection: null,
          food: ateFood ? createSnakeFood(nextSnake) : currentState.food
        };
      });

      if (nextScore !== null) {
        setScore(nextScore);
      }
      if (hitCount > 0) {
        setHits((currentHits) => currentHits + hitCount);
      }
      if (mistakeCount > 0) {
        setMistakes((currentMistakes) => currentMistakes + mistakeCount);
      }
    }, tickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeAppId, score, status]);

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

  const handlePacmanStatsChange = useCallback((nextStats: PcPacmanBoardStats) => {
    setPacmanStats((currentStats) =>
      currentStats.score === nextStats.score &&
      currentStats.hits === nextStats.hits &&
      currentStats.mistakes === nextStats.mistakes &&
      currentStats.lives === nextStats.lives &&
      currentStats.pelletsRemaining === nextStats.pelletsRemaining &&
      currentStats.frightenedActive === nextStats.frightenedActive
        ? currentStats
        : nextStats
    );
    setScore((currentScore) => (currentScore === nextStats.score ? currentScore : nextStats.score));
    setHits((currentHits) => (currentHits === nextStats.hits ? currentHits : nextStats.hits));
    setMistakes((currentMistakes) =>
      currentMistakes === nextStats.mistakes ? currentMistakes : nextStats.mistakes
    );
  }, []);

  function resetMiniGames() {
    setSnakeState(createInitialSnakeState());
    setStackerState(createInitialStackerState());
    setPacmanStats(createDefaultPacmanBoardStats());
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
      pc_snake: "Retro canvas snake with accelerating speed. Use arrow keys or the D-pad, and crashes reset the board.",
      pc_block_stacker: "Time the moving row and drop it with Space, Enter, or the button. Clean overlaps keep the tower alive.",
      pc_pacman: "Sweep the maze, eat the dots, and use power pellets to flip the chase."
    };

    return (
      <div className="pc-minigame__card pc-minigame__card--ready">
        <div className="pc-minigame__card-copy">
          <span className="pc-minigame__card-kicker">Launch app</span>
          <h3>{activeApp.label}</h3>
          <p>{activeApp.intro}</p>
        </div>
        <div className="pc-minigame__result-row">
          <span>Payout</span>
          <strong>{paidToday ? "Practice only" : "Reward available"}</strong>
        </div>
        <div className="pc-minigame__result-row">
          <span>How it plays</span>
          <strong className="pc-minigame__result-value pc-minigame__result-value--wrap">
            {rulesByApp[activeApp.id]}
          </strong>
        </div>
        <button className="pc-minigame__primary" onClick={handleStartRun} type="button">
          Run app
        </button>
        <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button">
          Back to desktop
        </button>
      </div>
    );
  }

  function renderSnakeBoard() {
    return (
      <div className="pc-minigame__playfield">
        <div className="pc-minigame__board-meta">
          <span>Retro Snake on a canvas board, adapted into the desk PC shell.</span>
          <span>Length {snakeState.snake.length}</span>
        </div>
        <div className="pc-retro-snake">
          <div className="pc-retro-snake__header">
            <div className="pc-retro-snake__brand">
              <span className="pc-retro-snake__icon">S</span>
              <div className="pc-retro-snake__brand-copy">
                <strong>Retro Snake</strong>
                <span>Canvas arcade mode</span>
              </div>
            </div>
            <span className="pc-retro-snake__pill">{mistakes > 0 ? `Crashes ${mistakes}` : "Clean run"}</span>
          </div>
          <div className="pc-retro-snake__scoreboard">
            <span>Best {snakeBestScore}</span>
            <span>Score {score}</span>
            <span>Speed {snakeSpeedLabel}</span>
          </div>
          <div className="pc-retro-snake__canvas-frame">
            <canvas
              ref={snakeCanvasRef}
              aria-label="Snake grid"
              className="pc-retro-snake__canvas"
              height={RETRO_SNAKE_CANVAS_SIZE}
              width={RETRO_SNAKE_CANVAS_SIZE}
            />
          </div>
        </div>
        <div className="pc-retro-snake__hint-row">
          <span>Arrows or WASD steer the snake.</span>
          <span>Each fruit speeds the board up.</span>
        </div>
        <div className="pc-minigame__control-pad">
          <button className="pc-minigame__primary pc-minigame__primary--pad" onClick={() => handleSnakeTurn("up")} type="button">
            Up
          </button>
          <div className="pc-minigame__control-row">
            <button className="pc-minigame__primary pc-minigame__primary--pad" onClick={() => handleSnakeTurn("left")} type="button">
              Left
            </button>
            <button className="pc-minigame__primary pc-minigame__primary--pad" onClick={() => handleSnakeTurn("down")} type="button">
              Down
            </button>
            <button className="pc-minigame__primary pc-minigame__primary--pad" onClick={() => handleSnakeTurn("right")} type="button">
              Right
            </button>
          </div>
        </div>
      </div>
    );
  }
  function renderStackerBoard() {
    return (
      <div className="pc-minigame__playfield">
        <div className="pc-minigame__board-meta">
          <span>Drop the moving row before it drifts out of alignment.</span>
          <span>Stack height {stackerState.settled.length}</span>
        </div>
        <div className="pc-minigame__grid-shell pc-minigame__grid-shell--stacker">
          <div aria-label="Block Stacker board" className="pc-minigame__stacker-board">
            {Array.from({ length: BLOCK_STACKER_ROWS }, (_, rowIndex) => {
              const settledSlice = stackerState.settled.find((slice) => slice.row === rowIndex) ?? null;
              const isActiveRow = rowIndex === stackerState.activeRow;

              return (
                <div key={`row-${rowIndex}`} className="pc-minigame__stacker-row">
                  {Array.from({ length: BLOCK_STACKER_COLUMNS }, (_, columnIndex) => {
                    const isSettled =
                      settledSlice !== null &&
                      columnIndex >= settledSlice.start &&
                      columnIndex < settledSlice.start + settledSlice.width;
                    const isActive =
                      isActiveRow &&
                      columnIndex >= stackerState.cursorStart &&
                      columnIndex < stackerState.cursorStart + stackerState.activeWidth;
                    const cellClassName = isActive
                      ? "pc-minigame__stacker-cell pc-minigame__stacker-cell--active"
                      : isSettled
                        ? "pc-minigame__stacker-cell pc-minigame__stacker-cell--settled"
                        : "pc-minigame__stacker-cell";

                    return <div key={`row-${rowIndex}-column-${columnIndex}`} className={cellClassName} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="pc-minigame__action-row">
          <button className="pc-minigame__primary pc-minigame__primary--wide" onClick={handleStackerDrop} type="button">
            Drop block
          </button>
        </div>
      </div>
    );
  }

  function renderPacmanBoard() {
    return <PcPacmanBoard onStatsChange={handlePacmanStatsChange} />;
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
      case "pc_pacman":
        return renderPacmanBoard();
      default:
        return null;
    }
  }

  const activityStatusLabel =
    activeAppId === "pc_snake"
      ? `Speed ${snakeSpeedLabel}`
      : activeAppId === "pc_block_stacker"
        ? `Stack ${stackerState.settled.length}/${BLOCK_STACKER_ROWS}`
        : activeAppId === "pc_pacman"
          ? pacmanStats.frightenedActive
            ? "Power mode"
            : `Dots ${pacmanStats.pelletsRemaining}`
          : "Ready";
  const desktopStatusLabel =
    status === "desktop"
      ? "Desktop ready"
      : status === "running"
        ? "Session live"
        : status === "results"
          ? "Run complete"
          : activeApp
            ? `${activeApp.label} ready`
            : "Ready";

  return (
    <div className="pc-minigame">
      <div
        className="pc-minigame__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Retro desk PC"
      >
        <div className="pc-minigame__header">
          <div className="pc-minigame__header-copy">
            <p className="pc-minigame__eyebrow">Desk PC</p>
            <h2 className="pc-minigame__title">Pixel Gigs</h2>
            <p className="pc-minigame__subtitle">
              Warm desk-night games styled to match the room clock, bottom dock, and drawer shell.
            </p>
          </div>
          <div className="pc-minigame__header-actions">
            <span className="pc-minigame__status-pill">{desktopStatusLabel}</span>
            <button className="pc-minigame__close" onClick={onExit} type="button">
              Exit PC
            </button>
          </div>
        </div>

        <div className="pc-minigame__stats">
          <div className="pc-minigame__stat">
            <span className="pc-minigame__stat-label">Wallet</span>
            <strong>{currentCoins.toLocaleString()} Coins</strong>
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

        <div className="pc-minigame__monitor">
          {status === "desktop" ? (
            <div className="pc-minigame__board pc-minigame__board--desktop">
              <div className="pc-minigame__desktop-bar">
                <span>Desktop ready</span>
                <span>{appDefinitions.length} apps loaded</span>
                <span>Replay anytime</span>
              </div>
              <div className="pc-minigame__desktop-grid">
                {appDefinitions.map((definition) => (
                  <button
                    key={definition.id}
                    className="pc-minigame__shortcut"
                    onClick={() => handleLaunchApp(definition.id)}
                    type="button"
                  >
                    <span className="pc-minigame__shortcut-badge">
                      {DESKTOP_SHORTCUT_BADGES[definition.id]}
                    </span>
                    <strong className="pc-minigame__shortcut-title">
                      {DESKTOP_SHORTCUT_LABELS[definition.id]}
                    </strong>
                    <span className="pc-minigame__shortcut-exe">{definition.executableName}</span>
                    <span className="pc-minigame__shortcut-copy">{definition.intro}</span>
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
                    <div className="pc-minigame__action-row pc-minigame__action-row--footer">
                      <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button">
                        Back to desktop
                      </button>
                    </div>
                  </div>
                ) : null}

                {status === "results" && lastRun ? (
                  <div className="pc-minigame__card pc-minigame__card--results">
                    <div className="pc-minigame__card-copy">
                      <span className="pc-minigame__card-kicker">Run summary</span>
                      <h3>{activeApp.label} results</h3>
                    </div>
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
                    <button className="pc-minigame__primary" onClick={handleStartRun} type="button">
                      Play again
                    </button>
                    <button className="pc-minigame__close" onClick={handleBackToDesktop} type="button">
                      Back to desktop
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <p className="pc-minigame__footer">
          Press <kbd>Esc</kbd> to close the computer. Rewards refresh by room day, but every app stays replayable.
        </p>
      </div>
    </div>
  );
}









