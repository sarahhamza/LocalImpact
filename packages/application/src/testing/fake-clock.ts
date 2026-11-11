import type { Clock } from "../ports";

export class FakeClock implements Clock {
  constructor(private current: Date = new Date("2026-01-01T09:00:00Z")) {}
  now(): Date {
    return new Date(this.current);
  }
  set(date: Date): void {
    this.current = new Date(date);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
