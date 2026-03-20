export interface WallOpeningDescriptor {
  center: number;
  width: number;
  centerY: number;
  height: number;
}

export interface WallSpanSegment {
  center: number;
  span: number;
}

export interface WallOpeningLayout {
  lowerBandCenterY: number | null;
  lowerBandHeight: number;
  openingBandCenterY: number | null;
  openingBandHeight: number;
  upperBandCenterY: number | null;
  upperBandHeight: number;
  middleSegments: WallSpanSegment[];
  railSegments: WallSpanSegment[];
  openings: Array<{
    center: number;
    width: number;
    start: number;
    end: number;
  }>;
}

type NormalizedOpening = {
  center: number;
  width: number;
  start: number;
  end: number;
  bottom: number;
  top: number;
};

function clampRange(start: number, end: number, min: number, max: number): [number, number] | null {
  const nextStart = Math.max(min, start);
  const nextEnd = Math.min(max, end);

  if (nextEnd - nextStart <= 0.0001) {
    return null;
  }

  return [nextStart, nextEnd];
}

function normalizeOpenings(
  openings: WallOpeningDescriptor[],
  wallMin: number,
  wallMax: number
): NormalizedOpening[] {
  return openings
    .map((opening) => {
      const horizontal = clampRange(
        opening.center - opening.width / 2,
        opening.center + opening.width / 2,
        wallMin,
        wallMax
      );

      if (!horizontal) {
        return null;
      }

      return {
        center: opening.center,
        width: horizontal[1] - horizontal[0],
        start: horizontal[0],
        end: horizontal[1],
        bottom: opening.centerY - opening.height / 2,
        top: opening.centerY + opening.height / 2
      };
    })
    .filter((opening): opening is NormalizedOpening => opening !== null)
    .sort((first, second) => first.start - second.start);
}

function mergeHorizontalOpenings(openings: NormalizedOpening[]): NormalizedOpening[] {
  return openings.reduce<NormalizedOpening[]>((merged, opening) => {
    const previous = merged[merged.length - 1];

    if (!previous || opening.start > previous.end + 0.0001) {
      merged.push({ ...opening });
      return merged;
    }

    previous.end = Math.max(previous.end, opening.end);
    previous.start = Math.min(previous.start, opening.start);
    previous.center = (previous.start + previous.end) / 2;
    previous.width = previous.end - previous.start;
    previous.bottom = Math.min(previous.bottom, opening.bottom);
    previous.top = Math.max(previous.top, opening.top);

    return merged;
  }, []);
}

function createSegmentsFromOpenings(
  openings: NormalizedOpening[],
  wallMin: number,
  wallMax: number
): WallSpanSegment[] {
  const segments: WallSpanSegment[] = [];
  let cursor = wallMin;

  openings.forEach((opening) => {
    if (opening.start > cursor + 0.0001) {
      const span = opening.start - cursor;
      segments.push({
        center: cursor + span / 2,
        span
      });
    }

    cursor = Math.max(cursor, opening.end);
  });

  if (wallMax > cursor + 0.0001) {
    const span = wallMax - cursor;
    segments.push({
      center: cursor + span / 2,
      span
    });
  }

  return segments;
}

export function createWallOpeningLayout(
  openings: WallOpeningDescriptor[],
  options: {
    wallMin: number;
    wallMax: number;
    wallBottomY: number;
    wallTopY: number;
    railY: number;
  }
): WallOpeningLayout {
  const normalizedOpenings = mergeHorizontalOpenings(
    normalizeOpenings(openings, options.wallMin, options.wallMax)
  );

  if (normalizedOpenings.length === 0) {
    return {
      lowerBandCenterY: (options.wallBottomY + options.wallTopY) / 2,
      lowerBandHeight: options.wallTopY - options.wallBottomY,
      openingBandCenterY: null,
      openingBandHeight: 0,
      upperBandCenterY: null,
      upperBandHeight: 0,
      middleSegments: [],
      railSegments: [
        {
          center: (options.wallMin + options.wallMax) / 2,
          span: options.wallMax - options.wallMin
        }
      ],
      openings: []
    };
  }

  const openingBottom = Math.max(
    options.wallBottomY,
    Math.min(...normalizedOpenings.map((opening) => opening.bottom))
  );
  const openingTop = Math.min(
    options.wallTopY,
    Math.max(...normalizedOpenings.map((opening) => opening.top))
  );
  const openingBandHeight = Math.max(0, openingTop - openingBottom);
  const lowerBandHeight = Math.max(0, openingBottom - options.wallBottomY);
  const upperBandHeight = Math.max(0, options.wallTopY - openingTop);
  const segmentedSpan = createSegmentsFromOpenings(
    normalizedOpenings,
    options.wallMin,
    options.wallMax
  );
  const railPassesThroughOpenings =
    options.railY > openingBottom + 0.0001 && options.railY < openingTop - 0.0001;

  return {
    lowerBandCenterY:
      lowerBandHeight > 0 ? options.wallBottomY + lowerBandHeight / 2 : null,
    lowerBandHeight,
    openingBandCenterY:
      openingBandHeight > 0 ? openingBottom + openingBandHeight / 2 : null,
    openingBandHeight,
    upperBandCenterY: upperBandHeight > 0 ? openingTop + upperBandHeight / 2 : null,
    upperBandHeight,
    middleSegments: openingBandHeight > 0 ? segmentedSpan : [],
    railSegments: railPassesThroughOpenings
      ? segmentedSpan
      : [
          {
            center: (options.wallMin + options.wallMax) / 2,
            span: options.wallMax - options.wallMin
          }
        ],
    openings: normalizedOpenings.map((opening) => ({
      center: opening.center,
      width: opening.width,
      start: opening.start,
      end: opening.end
    }))
  };
}
