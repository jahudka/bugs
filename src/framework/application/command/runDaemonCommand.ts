import type { CommandBus } from '$/framework/domain/bus/commandBus';
import { MigrateDb } from '$/framework/domain/command/migrateDb';
import type { AnyCommandFactory } from '$/framework/domain/console/commandFactory';
import type { AnyConsoleCommand } from '$/framework/domain/console/consoleCommand';
import type { DaemonTask } from '$/framework/domain/daemon/daemonTask';

export abstract class RunDaemonCommandFactory implements AnyCommandFactory {
  readonly name: string = 'daemon:run';
  readonly description: string = 'Run main process';

  options() {
    return [];
  }

  arguments() {
    return [];
  }

  abstract create(): Promise<RunDaemonCommand>;
}

export class RunDaemonCommand implements AnyConsoleCommand {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tasks: DaemonTask[],
  ) {}

  async execute(_: unknown, signal: AbortSignal): Promise<number> {
    await this.commandBus.handle(new MigrateDb(signal));

    if (signal.aborted) {
      return 0;
    }

    signal.addEventListener('abort', () => {
      console.log('\nTerminating...');
    });

    await Promise.all(this.tasks.map(async (task) => task.run(signal)));
    return 0;
  }
}
