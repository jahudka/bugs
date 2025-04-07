import type { Command } from './command';

export interface CommandBus {
  handle<Result>(command: Command<Result>): Promise<Result>;
}
