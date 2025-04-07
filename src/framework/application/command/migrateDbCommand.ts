import type { CommandBus } from '$/framework/domain/bus/commandBus';
import { MigrateDb } from '$/framework/domain/command/migrateDb';
import { $arg, type ArgumentDefinition } from '$/framework/domain/console/args';
import type { CommandFactory } from '$/framework/domain/console/commandFactory';
import type { ConsoleCommand } from '$/framework/domain/console/consoleCommand';

const args = [
  {
    name: 'version',
    type: $arg.str,
    summary:
      `The version to migrate to, or 'prev' to roll back the last applied migration. ` +
      'By default migrates to the latest version.',
  },
] as const satisfies ArgumentDefinition[];

export abstract class MigrateDbCommandFactory implements CommandFactory<[], typeof args> {
  readonly name: string = 'db:migrate';
  readonly description: string = 'Perform database migrations';

  options(): [] {
    return [];
  }

  arguments() {
    return args;
  }

  abstract create(): MigrateDbCommand;
}

export type MigrateDbOptions = {
  version?: string;
};

export class MigrateDbCommand implements ConsoleCommand<MigrateDbOptions> {
  constructor(private readonly commandBus: CommandBus) {}

  async execute(options: MigrateDbOptions, signal: AbortSignal): Promise<number> {
    await this.commandBus.handle(new MigrateDb(signal, options.version));
    return 0;
  }
}
