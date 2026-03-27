const MINUTES_PER_DAY = 24 * 60;

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
  const normalizedMinutes = wrapClockMinutes(Math.round(minutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  return `${hours.toString().padStart(2, "0")}:${remainingMinutes
    .toString()
    .padStart(2, "0")}`;
}

export function formatClock12h(minutes: number): { time: string; ampm: 'AM' | 'PM' } {
  const normalizedMinutes = wrapClockMinutes(Math.round(minutes));
  const hours24 = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  const time = `${hours12.toString().padStart(2, "0")}:${remainingMinutes
    .toString()
    .padStart(2, "0")}`;

  return { time, ampm };
}