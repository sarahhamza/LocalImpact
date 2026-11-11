import type { Clock } from "@acme/application";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
