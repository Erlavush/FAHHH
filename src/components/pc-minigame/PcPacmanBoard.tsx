import { useEffect, useRef, useState } from "react";
import "./pc-pacman.css";

type PacmanDirection = "up" | "down" | "left" | "right";
type GhostId = "blinky" | "pinky" | "inky" | "clyde";

type GridCell = {
  x: number;
  y: number;
};

type PacmanActor = GridCell & {
  direction: PacmanDirection;
  queuedDirection: PacmanDirection | null;
};

type PacmanGhost = GridCell & {
  color: string;
  direction: PacmanDirection;
  id: GhostId;
  label: string;
  releaseDelay: number;
  scatterTarget: GridCell;
};

export interface PcPacmanBoardStats {
  frightenedActive: boolean;
  hits: number;
  lives: number;
  mistakes: number;
  pelletsRemaining: number;
  score: number;
}

interface PcPacmanBoardProps {
  onStatsChange: (stats: PcPacmanBoardStats) => void;
}

interface PacmanBoardState {
  frightenedTicks: number;
  ghostCombo: number;
  ghosts: PacmanGhost[];
  hits: number;
  lives: number;
  mistakes: number;
  pacman: PacmanActor;
  pellets: Set<string>;
  powerPellets: Set<string>;
  score: number;
  tick: number;
}

const PACMAN_MAZE_TEMPLATE = [
  "                             ",
  " oooooooooooo  oooooooooooo  ",
  " o    o     o  o     o    o  ",
  " *    o     o  o     o    *  ",
  " o    o     o  o     o    o  ",
  " oooooooooooooooooooooooooo  ",
  " o    o  o        o  o    o  ",
  " o    o  o        o  o    o  ",
  " oooooo  oooo  oooo  oooooo  ",
  "      o     +  +     o       ",
  "      o     +  +     o       ",
  "      o  ++++++++++  o       ",
  "      o  +        +  o       ",
  "      o  +        +  o       ",
  "++++++o+++        +++o+++++++",
  "      o  +        +  o       ",
  "      o  +        +  o       ",
  "      o  ++++++++++  o       ",
  "      o  +        +  o       ",
  "      o  +        +  o       ",
  " oooooooooooo  oooooooooooo  ",
  " o    o     o  o     o    o  ",
  " o    o     o  o     o    o  ",
  " *oo  ooooooo++ooooooo  oo*  ",
  "   o  o  o        o  o  o    ",
  "   o  o  o        o  o  o    ",
  " oooooo  oooo  oooo  oooooo  ",
  " o          o  o          o  ",
  " o          o  o          o  ",
  " oooooooooooooooooooooooooo  ",
  "                             "
] as const;

const GRID_WIDTH = PACMAN_MAZE_TEMPLATE[0].length;
const GRID_HEIGHT = PACMAN_MAZE_TEMPLATE.length;
const CELL_SIZE = 16;
const PACMAN_TICK_MS = 130;
const POWER_MODE_TICKS = 40;
const TUNNEL_ROW_INDEX = 14;
const PACMAN_START: GridCell = { x: 14, y: 23 };
const GHOST_START_SEEDS = [
  {
    id: "blinky",
    label: "Blinky",
    color: "#ff4d6d",
    x: 14,
    y: 11,
    direction: "left",
    releaseDelay: 0,
    scatterTarget: { x: GRID_WIDTH - 3, y: 1 }
  },
  {
    id: "pinky",
    label: "Pinky",
    color: "#ff8bd1",
    x: 13,
    y: 14,
    direction: "up",
    releaseDelay: 6,
    scatterTarget: { x: 2, y: 1 }
  },
  {
    id: "inky",
    label: "Inky",
    color: "#68e4ff",
    x: 14,
    y: 14,
    direction: "up",
    releaseDelay: 12,
    scatterTarget: { x: GRID_WIDTH - 3, y: GRID_HEIGHT - 3 }
  },
  {
    id: "clyde",
    label: "Clyde",
    color: "#ffb347",
    x: 15,
    y: 14,
    direction: "up",
    releaseDelay: 18,
    scatterTarget: { x: 2, y: GRID_HEIGHT - 3 }
  }
] as const satisfies readonly PacmanGhost[];

function getCellKey(cell: GridCell): string {
  return `${cell.x}:${cell.y}`;
}

function createPelletSets() {
  const pellets = new Set<string>();
  const powerPellets = new Set<string>();

  PACMAN_MAZE_TEMPLATE.forEach((row, y) => {
    Array.from(row).forEach((tile, x) => {
      if (tile === "o") {
        pellets.add(getCellKey({ x, y }));
      }

      if (tile === "*") {
        powerPellets.add(getCellKey({ x, y }));
      }
    });
  });

  return {
    pellets,
    powerPellets
  };
}

function createInitialGhosts(): PacmanGhost[] {
  return GHOST_START_SEEDS.map((ghost) => ({
    ...ghost,
    scatterTarget: { ...ghost.scatterTarget }
  }));
}

function createInitialPacmanActor(): PacmanActor {
  return {
    ...PACMAN_START,
    direction: "left",
    queuedDirection: null
  };
}

function createInitialPacmanBoardState(): PacmanBoardState {
  const pelletSets = createPelletSets();

  return {
    frightenedTicks: 0,
    ghostCombo: 0,
    ghosts: createInitialGhosts(),
    hits: 0,
    lives: 3,
    mistakes: 0,
    pacman: createInitialPacmanActor(),
    pellets: pelletSets.pellets,
    powerPellets: pelletSets.powerPellets,
    score: 0,
    tick: 0
  };
}

function oppositeDirection(direction: PacmanDirection): PacmanDirection {
  switch (direction) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
    default:
      return "left";
  }
}

function directionDelta(direction: PacmanDirection): GridCell {
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

function wrapTunnelCell(cell: GridCell): GridCell {
  if (cell.y === TUNNEL_ROW_INDEX && cell.x < 0) {
    return { x: GRID_WIDTH - 1, y: cell.y };
  }

  if (cell.y === TUNNEL_ROW_INDEX && cell.x >= GRID_WIDTH) {
    return { x: 0, y: cell.y };
  }

  return cell;
}

function moveCell(cell: GridCell, direction: PacmanDirection): GridCell {
  const delta = directionDelta(direction);
  return wrapTunnelCell({
    x: cell.x + delta.x,
    y: cell.y + delta.y
  });
}

function getMazeTile(cell: GridCell): string {
  if (cell.x < 0 || cell.x >= GRID_WIDTH || cell.y < 0 || cell.y >= GRID_HEIGHT) {
    return " ";
  }

  return PACMAN_MAZE_TEMPLATE[cell.y]?.[cell.x] ?? " ";
}

function isWalkableCell(cell: GridCell): boolean {
  return getMazeTile(wrapTunnelCell(cell)) !== " ";
}

function areCellsEqual(left: GridCell, right: GridCell): boolean {
  return left.x === right.x && left.y === right.y;
}

function getAvailableDirections(cell: GridCell, currentDirection: PacmanDirection): PacmanDirection[] {
  const directions = (["up", "left", "down", "right"] as const).filter((direction) =>
    isWalkableCell(moveCell(cell, direction))
  );

  if (directions.length <= 1) {
    return directions;
  }

  const withoutReverse = directions.filter((direction) => direction !== oppositeDirection(currentDirection));
  return withoutReverse.length > 0 ? withoutReverse : directions;
}

function manhattanDistance(from: GridCell, to: GridCell): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function getPinkyTarget(pacman: PacmanActor): GridCell {
  const delta = directionDelta(pacman.direction);
  return {
    x: pacman.x + delta.x * 4,
    y: pacman.y + delta.y * 4
  };
}

function getInkyTarget(pacman: PacmanActor, blinky: PacmanGhost | undefined): GridCell {
  const blinkyCell = blinky ?? createInitialGhosts()[0];
  return {
    x: pacman.x + (pacman.x - blinkyCell.x),
    y: pacman.y + (pacman.y - blinkyCell.y)
  };
}

function chooseGhostTarget(
  ghost: PacmanGhost,
  pacman: PacmanActor,
  ghosts: PacmanGhost[],
  scatterPhaseActive: boolean
): GridCell {
  if (scatterPhaseActive) {
    return ghost.scatterTarget;
  }

  switch (ghost.id) {
    case "pinky":
      return getPinkyTarget(pacman);
    case "inky":
      return getInkyTarget(
        pacman,
        ghosts.find((candidate) => candidate.id === "blinky")
      );
    case "clyde":
      return manhattanDistance(ghost, pacman) < 8 ? ghost.scatterTarget : pacman;
    case "blinky":
    default:
      return pacman;
  }
}

function chooseGhostDirection(
  ghost: PacmanGhost,
  pacman: PacmanActor,
  ghosts: PacmanGhost[],
  frightenedActive: boolean,
  tick: number
): PacmanDirection {
  const choices = getAvailableDirections(ghost, ghost.direction);

  if (choices.length === 0) {
    return ghost.direction;
  }

  if (frightenedActive) {
    const shuffledChoices = [...choices].sort((left, right) => {
      const leftSeed = (left.charCodeAt(0) + ghost.id.charCodeAt(0) + tick) % 7;
      const rightSeed = (right.charCodeAt(0) + ghost.id.charCodeAt(0) + tick) % 7;
      return leftSeed - rightSeed;
    });

    let bestDirection = shuffledChoices[0];
    let bestDistance = Number.NEGATIVE_INFINITY;

    shuffledChoices.forEach((direction) => {
      const nextCell = moveCell(ghost, direction);
      const nextDistance = manhattanDistance(nextCell, pacman);
      if (nextDistance > bestDistance) {
        bestDistance = nextDistance;
        bestDirection = direction;
      }
    });

    return bestDirection;
  }

  const scatterPhaseActive = tick % 64 < 12;
  const target = chooseGhostTarget(ghost, pacman, ghosts, scatterPhaseActive);
  let bestDirection = choices[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  choices.forEach((direction) => {
    const nextCell = moveCell(ghost, direction);
    const nextDistance = manhattanDistance(nextCell, target);
    if (nextDistance < bestDistance) {
      bestDistance = nextDistance;
      bestDirection = direction;
    }
  });

  return bestDirection;
}

function createStatsSnapshot(state: PacmanBoardState): PcPacmanBoardStats {
  return {
    frightenedActive: state.frightenedTicks > 0,
    hits: state.hits,
    lives: state.lives,
    mistakes: state.mistakes,
    pelletsRemaining: state.pellets.size + state.powerPellets.size,
    score: state.score
  };
}

function resetActorPositions(state: PacmanBoardState, nextLives: number): PacmanBoardState {
  return {
    ...state,
    frightenedTicks: 0,
    ghostCombo: 0,
    ghosts: createInitialGhosts(),
    lives: nextLives,
    pacman: createInitialPacmanActor()
  };
}

function resolveGhostCollision(state: PacmanBoardState, ghostIndex: number): PacmanBoardState {
  const ghost = state.ghosts[ghostIndex];

  if (!ghost || ghost.releaseDelay > 0) {
    return state;
  }

  if (state.frightenedTicks > 0) {
    const ghosts = state.ghosts.map((candidate, index) =>
      index === ghostIndex
        ? {
            ...createInitialGhosts().find((seed) => seed.id === candidate.id)!,
            releaseDelay: 10
          }
        : candidate
    );
    const comboMultiplier = Math.min(4, state.ghostCombo + 1);

    return {
      ...state,
      ghostCombo: comboMultiplier,
      ghosts,
      hits: state.hits + 2,
      score: state.score + comboMultiplier * 120
    };
  }

  const remainingLives = state.lives > 1 ? state.lives - 1 : 3;
  const scorePenalty = state.lives > 1 ? 0 : 60;
  return resetActorPositions(
    {
      ...state,
      mistakes: state.mistakes + 1,
      score: Math.max(0, state.score - scorePenalty)
    },
    remainingLives
  );
}

function refillMaze(state: PacmanBoardState): PacmanBoardState {
  const pelletSets = createPelletSets();

  return {
    ...resetActorPositions(state, state.lives),
    ghostCombo: 0,
    hits: state.hits + 4,
    pellets: pelletSets.pellets,
    powerPellets: pelletSets.powerPellets,
    score: state.score + 500
  };
}

function stepPacmanBoard(state: PacmanBoardState): PacmanBoardState {
  const frightenedTicks = Math.max(0, state.frightenedTicks - 1);
  const nextState: PacmanBoardState = {
    ...state,
    frightenedTicks,
    ghostCombo: frightenedTicks === 0 ? 0 : state.ghostCombo,
    tick: state.tick + 1
  };

  let directionToUse = nextState.pacman.direction;
  const queuedDirection = nextState.pacman.queuedDirection;

  if (queuedDirection && isWalkableCell(moveCell(nextState.pacman, queuedDirection))) {
    directionToUse = queuedDirection;
  }

  let pacmanCell = { x: nextState.pacman.x, y: nextState.pacman.y };
  if (isWalkableCell(moveCell(nextState.pacman, directionToUse))) {
    pacmanCell = moveCell(nextState.pacman, directionToUse);
  }

  nextState.pacman = {
    ...nextState.pacman,
    ...pacmanCell,
    direction: directionToUse
  };

  const pelletKey = getCellKey(pacmanCell);
  if (nextState.pellets.has(pelletKey)) {
    const pellets = new Set(nextState.pellets);
    pellets.delete(pelletKey);
    nextState.pellets = pellets;
    nextState.hits += 1;
    nextState.score += 10;
  }

  if (nextState.powerPellets.has(pelletKey)) {
    const powerPellets = new Set(nextState.powerPellets);
    powerPellets.delete(pelletKey);
    nextState.powerPellets = powerPellets;
    nextState.frightenedTicks = POWER_MODE_TICKS;
    nextState.ghostCombo = 0;
    nextState.hits += 1;
    nextState.score += 50;
  }

  for (let index = 0; index < nextState.ghosts.length; index += 1) {
    if (areCellsEqual(nextState.ghosts[index], nextState.pacman)) {
      const resolvedState = resolveGhostCollision(nextState, index);
      if (resolvedState !== nextState) {
        return resolvedState;
      }
    }
  }

  nextState.ghosts = nextState.ghosts.map((ghost) => {
    if (ghost.releaseDelay > 0) {
      return {
        ...ghost,
        releaseDelay: ghost.releaseDelay - 1
      };
    }

    const direction = chooseGhostDirection(
      ghost,
      nextState.pacman,
      nextState.ghosts,
      nextState.frightenedTicks > 0,
      nextState.tick
    );

    return {
      ...ghost,
      ...moveCell(ghost, direction),
      direction
    };
  });

  for (let index = 0; index < nextState.ghosts.length; index += 1) {
    if (areCellsEqual(nextState.ghosts[index], nextState.pacman)) {
      return resolveGhostCollision(nextState, index);
    }
  }

  if (nextState.pellets.size === 0 && nextState.powerPellets.size === 0) {
    return refillMaze(nextState);
  }

  return nextState;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string
) {
  context.beginPath();

  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
  } else {
    context.rect(x, y, width, height);
  }

  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.lineWidth = 1.5;
    context.stroke();
  }
}

function drawPacman(context: CanvasRenderingContext2D, pacman: PacmanActor, tick: number) {
  const centerX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = pacman.y * CELL_SIZE + CELL_SIZE / 2;
  const mouthOpen = tick % 4 < 2 ? 0.22 : 0.08;
  const rotationByDirection: Record<PacmanDirection, number> = {
    up: -Math.PI / 2,
    down: Math.PI / 2,
    left: Math.PI,
    right: 0
  };

  context.save();
  context.translate(centerX, centerY);
  context.rotate(rotationByDirection[pacman.direction]);
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, CELL_SIZE * 0.42, mouthOpen * Math.PI, (2 - mouthOpen) * Math.PI);
  context.closePath();
  context.fillStyle = "#ffd84d";
  context.fill();
  context.restore();
}

function drawGhost(context: CanvasRenderingContext2D, ghost: PacmanGhost, frightenedActive: boolean) {
  const left = ghost.x * CELL_SIZE + 2;
  const top = ghost.y * CELL_SIZE + 2;
  const width = CELL_SIZE - 4;
  const height = CELL_SIZE - 4;
  const bodyColor = frightenedActive ? "#4d74ff" : ghost.color;

  drawRoundedRect(context, left, top, width, height, 5, bodyColor, "rgba(255, 255, 255, 0.12)");

  const eyeY = top + 5;
  const leftEyeX = left + 4;
  const rightEyeX = left + width - 8;

  context.fillStyle = "#ffffff";
  context.fillRect(leftEyeX, eyeY, 4, 5);
  context.fillRect(rightEyeX, eyeY, 4, 5);
  context.fillStyle = frightenedActive ? "#ffffff" : "#132242";
  context.fillRect(leftEyeX + 1, eyeY + 2, 2, 2);
  context.fillRect(rightEyeX + 1, eyeY + 2, 2, 2);
}

export function PcPacmanBoard({ onStatsChange }: PcPacmanBoardProps) {
  const [boardState, setBoardState] = useState<PacmanBoardState>(() => createInitialPacmanBoardState());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setBoardState((currentState) => stepPacmanBoard(currentState));
    }, PACMAN_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    onStatsChange(createStatsSnapshot(boardState));
  }, [boardState, onStatsChange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const directionByKey: Record<string, PacmanDirection> = {
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

      if (!nextDirection) {
        return;
      }

      event.preventDefault();
      setBoardState((currentState) => ({
        ...currentState,
        pacman: {
          ...currentState.pacman,
          queuedDirection: nextDirection
        }
      }));
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

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

    context.clearRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
    context.fillStyle = "#03050b";
    context.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);

    PACMAN_MAZE_TEMPLATE.forEach((row, y) => {
      Array.from(row).forEach((tile, x) => {
        const drawX = x * CELL_SIZE;
        const drawY = y * CELL_SIZE;

        if (tile === " ") {
          drawRoundedRect(context, drawX + 1, drawY + 1, CELL_SIZE - 2, CELL_SIZE - 2, 5, "#0d1733", "rgba(104, 228, 255, 0.12)");
          return;
        }

        context.fillStyle = "rgba(9, 12, 20, 0.9)";
        context.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
      });
    });

    boardState.pellets.forEach((key) => {
      const [x, y] = key.split(":").map(Number);
      context.beginPath();
      context.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 2.2, 0, Math.PI * 2);
      context.fillStyle = "#ffe8ad";
      context.fill();
    });

    boardState.powerPellets.forEach((key) => {
      const [x, y] = key.split(":").map(Number);
      context.beginPath();
      context.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, boardState.tick % 6 < 3 ? 4.2 : 3.2, 0, Math.PI * 2);
      context.fillStyle = "#ffd84d";
      context.fill();
    });

    drawPacman(context, boardState.pacman, boardState.tick);
    boardState.ghosts.forEach((ghost) => drawGhost(context, ghost, boardState.frightenedTicks > 0 && ghost.releaseDelay === 0));

    context.strokeStyle = "rgba(104, 228, 255, 0.18)";
    context.lineWidth = 2;
    context.strokeRect(1, 1, GRID_WIDTH * CELL_SIZE - 2, GRID_HEIGHT * CELL_SIZE - 2);
  }, [boardState]);

  const boardStats = createStatsSnapshot(boardState);

  return (
    <div className="pc-pacman">
      <div className="pc-pacman__header">
        <div className="pc-pacman__brand">
          <span className="pc-pacman__icon">P</span>
          <div className="pc-pacman__brand-copy">
            <strong>Pacman Night Shift</strong>
            <span>Classic maze chase, tuned for the desk PC shell</span>
          </div>
        </div>
        <span className="pc-pacman__pill">
          {boardStats.frightenedActive ? "Power mode" : `${boardStats.pelletsRemaining} dots left`}
        </span>
      </div>

      <div className="pc-pacman__scoreboard">
        <span>Score {boardStats.score}</span>
        <span>Lives {boardStats.lives}</span>
        <span>Mistakes {boardStats.mistakes}</span>
      </div>

      <div className="pc-pacman__canvas-frame">
        <canvas
          ref={canvasRef}
          aria-label="Pacman maze"
          className="pc-pacman__canvas"
          height={GRID_HEIGHT * CELL_SIZE}
          width={GRID_WIDTH * CELL_SIZE}
        />
      </div>

      <div className="pc-pacman__hint-row">
        <span>Eat pellets, pop a power pellet, and flip the chase back on the ghosts.</span>
        <span>Arrow keys or WASD move. The board refills when you clear the maze.</span>
      </div>

      <div className="pc-minigame__control-pad">
        <button
          className="pc-minigame__primary pc-minigame__primary--pad"
          onClick={() => {
            setBoardState((currentState) => ({
              ...currentState,
              pacman: {
                ...currentState.pacman,
                queuedDirection: "up"
              }
            }));
          }}
          type="button"
        >
          Up
        </button>
        <div className="pc-minigame__control-row">
          <button
            className="pc-minigame__primary pc-minigame__primary--pad"
            onClick={() => {
              setBoardState((currentState) => ({
                ...currentState,
                pacman: {
                  ...currentState.pacman,
                  queuedDirection: "left"
                }
              }));
            }}
            type="button"
          >
            Left
          </button>
          <button
            className="pc-minigame__primary pc-minigame__primary--pad"
            onClick={() => {
              setBoardState((currentState) => ({
                ...currentState,
                pacman: {
                  ...currentState.pacman,
                  queuedDirection: "down"
                }
              }));
            }}
            type="button"
          >
            Down
          </button>
          <button
            className="pc-minigame__primary pc-minigame__primary--pad"
            onClick={() => {
              setBoardState((currentState) => ({
                ...currentState,
                pacman: {
                  ...currentState.pacman,
                  queuedDirection: "right"
                }
              }));
            }}
            type="button"
          >
            Right
          </button>
        </div>
      </div>
    </div>
  );
}

