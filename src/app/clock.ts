const MINUTES_PER_DAY = 24 * 60;
const SECONDS_PER_DAY = MINUTES_PER_DAY * 60;

type ClockMeridiem = "AM" | "PM";

type Clock12h = {
  time: string;
  ampm: ClockMeridiem;
};

function wrapClockSeconds(seconds: number): number {
  const wrappedSeconds = Math.floor(seconds) % SECONDS_PER_DAY;
  return wrappedSeconds < 0 ? wrappedSeconds + SECONDS_PER_DAY : wrappedSeconds;
}

function getClockParts(minutes: number): {
  hours24: number;
  hours12: number;
  minutes: number;
  seconds: number;
  ampm: ClockMeridiem;
} {
  const normalizedSeconds = wrapClockSeconds(wrapClockMinutes(minutes) * 60);
  const hours24 = Math.floor(normalizedSeconds / 3600);
  const remainingSeconds = normalizedSeconds % 3600;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const ampm: ClockMeridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return {
    hours24,
    hours12,
    minutes: remainingMinutes,
    seconds,
    ampm
  };
}

export function wrapClockMinutes(minutes: number): number {
  const wrappedMinutes = minutes % MINUTES_PER_DAY;
  return wrappedMinutes < 0 ? wrappedMinutes + MINUTES_PER_DAY : wrappedMinutes;
}

export function getLocalClockMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function minutesToControlHours(minutes: number): number {
  return wrapClockMinutes(Math.round(minutes)) / 60;
}

export function controlHoursToMinutes(hours: number): number {
  return wrapClockMinutes(Math.round(hours * 60));
}

export function formatClock24h(minutes: number): string {
  const parts = getClockParts(minutes);

  return `${parts.hours24.toString().padStart(2, "0")}:${parts.minutes
    .toString()
    .padStart(2, "0")}`;
}

export function formatClock12h(minutes: number): Clock12h {
  const parts = getClockParts(minutes);

  return {
    time: `${parts.hours12.toString().padStart(2, "0")}:${parts.minutes
      .toString()
      .padStart(2, "0")}`,
    ampm: parts.ampm
  };
}

export function formatClock12hWithSeconds(minutes: number): Clock12h {
  const parts = getClockParts(minutes);

  return {
    time: `${parts.hours12.toString().padStart(2, "0")}:${parts.minutes
      .toString()
      .padStart(2, "0")}:${parts.seconds.toString().padStart(2, "0")}`,
    ampm: parts.ampm
  };
}