import { wrapClockMinutes } from "../app/clock";

/**
 * Minecraft Time Constants:
 * 20 ticks = 1 second
 * 1200 ticks = 1 minute
 * 24000 ticks = 1 day (20 minutes real time)
 * 
 * Minecraft Tick to Time of Day:
 * 0: 6:00 AM (Sunrise)
 * 6000: 12:00 PM (Noon)
 * 12000: 6:00 PM (Sunset)
 * 18000: 12:00 AM (Midnight)
 * 24000: 6:00 AM (Sunrise, wraps to 0)
 */

export const TICKS_PER_SECOND = 20;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND; // 50ms
export const TICKS_PER_DAY = 24000;

/**
 * Converts Minecraft ticks (0-23999) to fractional day minutes (0-1439).
 * Minecraft 0 ticks is 6:00 AM (360 minutes).
 */
export function ticksToMinutes(ticks: number): number {
  // Shift by 6 hours (360 minutes) to align 0 ticks with 6:00 AM
  const minutes = (ticks / 24000) * 1440;
  return (minutes + 360) % 1440;
}

/**
 * Converts fractional day minutes (0-1439) to Minecraft ticks (0-23999).
 * 6:00 AM (360 minutes) is 0 ticks.
 */
export function minutesToTicks(minutes: number): number {
  const shiftedMinutes = (minutes - 360 + 1440) % 1440;
  return (shiftedMinutes / 1440) * 24000;
}

export class GameLoopManager {
  private lastTickTime: number = 0;
  private accumulator: number = 0;
  private currentTicks: number = 0;
  private onTick: (ticks: number) => void;

  constructor(initialMinutes: number, onTick: (ticks: number) => void) {
    this.currentTicks = minutesToTicks(initialMinutes);
    this.onTick = onTick;
  }

  public update(now: number) {
    if (this.lastTickTime === 0) {
      this.lastTickTime = now;
      return;
    }

    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;
    this.accumulator += deltaTime;

    while (this.accumulator >= MS_PER_TICK) {
      this.currentTicks = (this.currentTicks + 1) % TICKS_PER_DAY;
      this.onTick(this.currentTicks);
      this.accumulator -= MS_PER_TICK;
    }
  }

  public getPartialTick(): number {
    return this.accumulator / MS_PER_TICK;
  }

  public getTicks(): number {
    return this.currentTicks;
  }
  
  public setMinutes(minutes: number) {
    this.currentTicks = minutesToTicks(minutes);
    this.accumulator = 0;
  }
}
