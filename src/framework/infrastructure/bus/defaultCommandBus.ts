import type { Command } from '$/framework/domain/bus/command';
import type { CommandBus } from '$/framework/domain/bus/commandBus';
import type {
  AnyCommandHandlerFactory,
  CommandConstructor,
} from '$/framework/domain/bus/commandHandler';
import type { CommandMiddleware } from '$/framework/domain/bus/commandMiddleware';
import { compileMiddlewareChain } from './utils';

export class DefaultCommandBus implements CommandBus {
  private readonly handlers: Map<CommandConstructor, AnyCommandHandlerFactory>;
  private readonly withMiddlewares: <Result>(
    command: Command<Result>,
    handle: () => Promise<Result>,
  ) => Promise<Result>;

  constructor(handlers: AnyCommandHandlerFactory[], middlewares: CommandMiddleware[] = []) {
    this.handlers = new Map(handlers.map((h) => [h.command, h]));
    this.withMiddlewares = compileMiddlewareChain(middlewares);
  }

  async handle<Result>(command: Command<Result>): Promise<Result> {
    const factory = this.handlers.get(command.constructor as CommandConstructor);

    if (!factory) {
      throw new Error(`Unsupported command: ${command.constructor.name}`);
    }

    return this.withMiddlewares(command, async () => {
      const handler = await factory.create();
      return handler.handle(command) as Result;
    });
  }
}
