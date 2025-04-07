import type { Application } from '$/framework/domain/console/application';
import { BadArgumentError, parseArgs } from '$/framework/domain/console/args';
import type { AnyCommandFactory } from '$/framework/domain/console/commandFactory';
import type { CommandResolver } from '$/framework/domain/console/commandResolver';
import type { ConsoleOutput } from '$/framework/domain/console/consoleOutput';
import { AmbiguousCommandError } from '$/framework/domain/console/errors';
import { cmdRow, globalArgs, globalOptions } from './utils';

export class DefaultApplication implements Application {
  constructor(
    readonly name: string,
    readonly description: string,
    private readonly commands: CommandResolver,
    private readonly output: ConsoleOutput,
  ) {}

  async run(args: string[]): Promise<number> {
    let factory: AnyCommandFactory | undefined = undefined;

    try {
      const options = parseArgs(args, globalOptions, globalArgs);
      factory = this.commands.resolve(options.command);
      return options.help ? this.printHelp(factory) : this.execute(factory, options.args);
    } catch (e: any) {
      if (e instanceof BadArgumentError) {
        this.output.header(`{red ${e.message}}`);
        factory && this.printHelp(factory);
      } else if (e instanceof AmbiguousCommandError) {
        this.output
          .header(`{red Ambiguous command: ${e.command}}`)
          .log('Did you mean one of these?')
          .table(e.candidates.map(cmdRow));
      } else {
        this.output.header(`{red Error: ${e.message}}`);
        this.output.log(e.stack);
      }

      return 1;
    }
  }

  private async execute(factory: AnyCommandFactory, args: string[]): Promise<number> {
    const options = parseArgs(args, factory.options(), factory.arguments());
    const command = await factory.create();
    const controller = new AbortController();
    const abort = (signal: 'SIGINT' | 'SIGTERM') => {
      process.off('SIGINT', abort);
      process.off('SIGTERM', abort);
      controller.abort(signal);
    };

    process.on('SIGINT', abort);
    process.on('SIGTERM', abort);

    return await command.execute(options, controller.signal);
  }

  private printHelp(command: AnyCommandFactory): number {
    const options = command.options();
    const args = command.arguments();
    const argSynopsis = args.map((arg) => {
      if (arg.rest) {
        return arg.required ? ` <${arg.name}>[, ...${arg.name}]` : ` [...${arg.name}]`;
      } else {
        return arg.required ? ` <${arg.name}>` : ` [${arg.name}]`;
      }
    });

    this.output.header(`{green ${this.name} ${command.name}}`).log(command.description);

    this.output
      .header('Synopsis')
      .log(`$ ${this.name} ${command.name} {gray [options]}${argSynopsis.join('')}`);

    if (args.length) {
      this.output.header('Arguments').table(
        args.map(({ name, summary, required }) => ({
          name,
          summary: `${required ? '(required) ' : ''}${summary}`,
        })),
      );
    }

    if (options.length) {
      this.output.header('Options').options(options);
    }

    this.output.header('Global options').options(globalOptions);

    return 0;
  }
}
