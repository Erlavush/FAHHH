export type ViewportMetrics = {
  width: number;
  height: number;
  devicePixelRatio: number;
};

const FALLBACK_VIEWPORT_WIDTH = 1920;
const FALLBACK_VIEWPORT_HEIGHT = 1080;
const FALLBACK_DEVICE_PIXEL_RATIO = 1;
const MIN_CANVAS_DPR = 0.1;
const MAX_CANVAS_DRAW_BUFFER_DIMENSION = 8192;
const MAX_CANVAS_RENDER_PIXELS = 16_000_000;

export function readViewportMetrics(): ViewportMetrics {
  if (typeof window === "undefined") {
    return {
      width: FALLBACK_VIEWPORT_WIDTH,
      height: FALLBACK_VIEWPORT_HEIGHT,
      devicePixelRatio: FALLBACK_DEVICE_PIXEL_RATIO
    };
  }

  return {
    width: Math.max(window.innerWidth || FALLBACK_VIEWPORT_WIDTH, 1),
    height: Math.max(window.innerHeight || FALLBACK_VIEWPORT_HEIGHT, 1),
    devicePixelRatio: Math.max(window.devicePixelRatio || FALLBACK_DEVICE_PIXEL_RATIO, MIN_CANVAS_DPR)
  };
}

export function resolveCanvasDpr(baseMaxDpr: number, viewport: ViewportMetrics): number {
  const safeWidth = Math.max(viewport.width, 1);
  const safeHeight = Math.max(viewport.height, 1);
  const safeBaseMaxDpr = Math.max(baseMaxDpr, MIN_CANVAS_DPR);
  const safeDevicePixelRatio = Math.max(viewport.devicePixelRatio, MIN_CANVAS_DPR);
  const dprByDimension = MAX_CANVAS_DRAW_BUFFER_DIMENSION / Math.max(safeWidth, safeHeight);
  const dprByPixelBudget = Math.sqrt(MAX_CANVAS_RENDER_PIXELS / (safeWidth * safeHeight));

  return Math.max(
    MIN_CANVAS_DPR,
    Math.min(safeBaseMaxDpr, safeDevicePixelRatio, dprByDimension, dprByPixelBudget)
  );
}

export function isCanvasDprConstrained(
  resolvedCanvasDpr: number,
  baseMaxDpr: number,
  viewport: ViewportMetrics
): boolean {
  const rawTargetDpr = Math.min(
    Math.max(baseMaxDpr, MIN_CANVAS_DPR),
    Math.max(viewport.devicePixelRatio, MIN_CANVAS_DPR)
  );

  return resolvedCanvasDpr < rawTargetDpr - 0.001;
}
