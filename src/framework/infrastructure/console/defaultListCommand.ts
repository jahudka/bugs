import type { Application } from '$/framework/domain/console/application';
import type { CommandFactory } from '$/framework/domain/console/commandFactory';
import type { CommandResolver } from '$/framework/domain/console/commandResolver';
import type { ConsoleCommand } from '$/framework/domain/console/consoleCommand';
import type { ConsoleOutput } from '$/framework/domain/console/consoleOutput';
import { globalOptions } from './utils';

export abstract class DefaultListCommandFactory implements CommandFactory<[], []> {
  readonly name: string = 'list';
  readonly description: string = 'List available commands';

  arguments(): [] {
    return [];
  }

  options(): [] {
    return [];
  }

  abstract create(): Promise<DefaultListCommand>;
}

export class DefaultListCommand implements ConsoleCommand<object> {
  constructor(
    private readonly getApplication: () => Application,
    private readonly getResolver: () => CommandResolver,
    private readonly output: ConsoleOutput,
  ) {}

  execute(): number {
    const application = this.getApplication();

    this.output
      .header(`{green ${application.name}}`)
      .log(application.description)
      .header('Synopsis')
      .log(`$ ${application.name} <command> {gray [options] [...args]}`)
      .header('Global options')
      .options(globalOptions)
      .header('Command list')
      .table(this.getResolver().getCommandList());

    return 0;
  }
}
