import type { AnyCommandFactory } from './commandFactory';

export type CommandInfo = {
  name: string;
  summary: string;
};

export interface CommandResolver {
  getCommandList(): CommandInfo[];
  resolve(command?: string): AnyCommandFactory;
}
