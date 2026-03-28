import { describe, expect, it } from "vitest";
import {
  formatClock12h,
  formatClock12hWithSeconds,
  formatClock24h,
  getLocalClockMinutes
} from "../src/app/clock";

describe("clock formatting", () => {
  it("keeps the existing minute-only labels stable", () => {
    expect(formatClock24h(12 * 60 + 34.8)).toBe("12:34");
    expect(formatClock12h(12 * 60 + 34.8)).toEqual({
      time: "12:34",
      ampm: "PM"
    });
  });

  it("formats second-based labels for the cat clock", () => {
    expect(formatClock12hWithSeconds(5 * 60 + 15 + 8 / 60)).toEqual({
      time: "05:15:08",
      ampm: "AM"
    });
    expect(formatClock12hWithSeconds(13 * 60 + 2 + 59 / 60)).toEqual({
      time: "01:02:59",
      ampm: "PM"
    });
  });

  it("reads local time with second precision", () => {
    const localMinutes = getLocalClockMinutes(new Date("2026-03-28T05:15:42"));
    expect(formatClock12hWithSeconds(localMinutes)).toEqual({
      time: "05:15:42",
      ampm: "AM"
    });
  });
});