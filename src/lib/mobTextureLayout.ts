export const MATERIAL_ORDER = ["right", "left", "top", "bottom", "front", "back"] as const;

export type CubeFace = (typeof MATERIAL_ORDER)[number];

export type TextureSize = [number, number];
export type FaceUvBounds = [number, number, number, number];
export type CubeFaceUvMap = Partial<Record<CubeFace, FaceUvBounds>>;

export type FaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  flipX?: boolean;
  flipY?: boolean;
};

export type CubeFaceMap = Record<CubeFace, FaceRect>;

export function isTextureSize(value: unknown): value is TextureSize {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry) && entry > 0)
  );
}

export function isFaceUvBounds(value: unknown): value is FaceUvBounds {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

export function resolveTextureSize(
  logicalTextureSize: TextureSize | undefined,
  actualTextureSize: TextureSize
): TextureSize {
  return isTextureSize(logicalTextureSize) ? logicalTextureSize : actualTextureSize;
}

export function createBoxFaceMap(
  u: number,
  v: number,
  width: number,
  height: number,
  depth: number,
  mirror = false
): CubeFaceMap {
  const right = { x: u, y: v + depth, width: depth, height };
  const front = { x: u + depth, y: v + depth, width, height };
  const left = { x: u + depth + width, y: v + depth, width: depth, height };
  const back = { x: u + depth + width + depth, y: v + depth, width, height };
  const top = { x: u + depth, y: v, width, height: depth };
  const bottom = { x: u + depth + width, y: v, width, height: depth };

  return {
    right: mirror ? left : right,
    left: mirror ? right : left,
    top,
    bottom,
    front,
    back
  };
}

function toPixel(value: number, minimum = 0): number {
  const rounded = Math.round(value);
  return Math.max(minimum, rounded);
}

function createFaceRectFromBounds(bounds: FaceUvBounds): FaceRect {
  const [u1, v1, u2, v2] = bounds;

  return {
    x: toPixel(Math.min(u1, u2)),
    y: toPixel(Math.min(v1, v2)),
    width: toPixel(Math.abs(u2 - u1), 1),
    height: toPixel(Math.abs(v2 - v1), 1),
    flipX: u2 < u1,
    flipY: v2 < v1
  };
}

export function createExplicitFaceMap(faceUvs: CubeFaceUvMap): CubeFaceMap | null {
  if (!MATERIAL_ORDER.every((face) => isFaceUvBounds(faceUvs[face]))) {
    return null;
  }

  return {
    right: createFaceRectFromBounds(faceUvs.right as FaceUvBounds),
    left: createFaceRectFromBounds(faceUvs.left as FaceUvBounds),
    top: createFaceRectFromBounds(faceUvs.top as FaceUvBounds),
    bottom: createFaceRectFromBounds(faceUvs.bottom as FaceUvBounds),
    front: createFaceRectFromBounds(faceUvs.front as FaceUvBounds),
    back: createFaceRectFromBounds(faceUvs.back as FaceUvBounds)
  };
}

export function scaleFaceRect(
  rect: FaceRect,
  logicalTextureSize: TextureSize,
  actualTextureSize: TextureSize
): FaceRect {
  const logicalWidth = logicalTextureSize[0];
  const logicalHeight = logicalTextureSize[1];
  const actualWidth = actualTextureSize[0];
  const actualHeight = actualTextureSize[1];
  const scaleX = actualWidth / logicalWidth;
  const scaleY = actualHeight / logicalHeight;

  const scaledRect: FaceRect = {
    x: toPixel(rect.x * scaleX),
    y: toPixel(rect.y * scaleY),
    width: toPixel(rect.width * scaleX, 1),
    height: toPixel(rect.height * scaleY, 1)
  };

  if (rect.flipX !== undefined) {
    scaledRect.flipX = rect.flipX;
  }

  if (rect.flipY !== undefined) {
    scaledRect.flipY = rect.flipY;
  }

  return scaledRect;
}

export function scaleFaceMap(
  faceMap: CubeFaceMap,
  logicalTextureSize: TextureSize,
  actualTextureSize: TextureSize
): CubeFaceMap {
  return {
    right: scaleFaceRect(faceMap.right, logicalTextureSize, actualTextureSize),
    left: scaleFaceRect(faceMap.left, logicalTextureSize, actualTextureSize),
    top: scaleFaceRect(faceMap.top, logicalTextureSize, actualTextureSize),
    bottom: scaleFaceRect(faceMap.bottom, logicalTextureSize, actualTextureSize),
    front: scaleFaceRect(faceMap.front, logicalTextureSize, actualTextureSize),
    back: scaleFaceRect(faceMap.back, logicalTextureSize, actualTextureSize)
  };
}

