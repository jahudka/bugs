import type { Command } from './command';

export interface CommandMiddleware {
  readonly priority: number;
  handle<Result>(command: Command<Result>, next: () => Promise<Result>): Promise<Result>;
}
