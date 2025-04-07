import type { Command } from '$/framework/domain/bus/command';
import type { CommandHandler, CommandHandlerFactory } from '$/framework/domain/bus/commandHandler';
import { $resultType } from '$/framework/domain/bus/types';
import type { SchemaManager } from '$/framework/domain/orm/schemaManager';

export class MigrateDb implements Command<void> {
  [$resultType]?: void;

  constructor(
    readonly signal: AbortSignal,
    readonly version?: string,
  ) {}
}

export abstract class MigrateDbHandlerFactory implements CommandHandlerFactory<MigrateDb> {
  readonly command = MigrateDb;
  abstract create(): Promise<MigrateDbHandler>;
}

export class MigrateDbHandler implements CommandHandler<MigrateDb> {
  constructor(private readonly schemaManager: SchemaManager) {}

  handle(command: MigrateDb): void {
    this.schemaManager.migrate(command.version);
  }
}
