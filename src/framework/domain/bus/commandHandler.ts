import type { Command } from './command';

export interface CommandConstructor<C extends Command = any> {
  new (...args: any): C;
}

export interface AnyCommandHandlerFactory {
  readonly command: CommandConstructor;
  create(): Promise<AnyCommandHandler> | AnyCommandHandler;
}

export interface CommandHandlerFactory<C extends Command> extends AnyCommandHandlerFactory {
  readonly command: CommandConstructor<C>;
  create(): Promise<CommandHandler<C>> | CommandHandler<C>;
}

export interface AnyCommandHandler {
  handle(command: Command): Promise<unknown> | unknown;
}

export interface CommandHandler<C extends Command> extends AnyCommandHandler {
  handle(command: C): CommandResult<C>;
}

type CommandResult<C extends Command> = C extends Command<infer R> ? Promise<R> | R : never;
