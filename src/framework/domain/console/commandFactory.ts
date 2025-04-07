import type { ArgumentDefinition, OptionDefinition, ParsedArguments, ParsedOptions } from './args';
import type { AnyConsoleCommand, ConsoleCommand } from './consoleCommand';

export interface AnyCommandFactory {
  readonly name: string;
  readonly description: string;
  options(): OptionDefinition[];
  arguments(): ArgumentDefinition[];
  create(): Promise<AnyConsoleCommand> | AnyConsoleCommand;
}

export interface CommandFactory<
  Options extends OptionDefinition[],
  Arguments extends ArgumentDefinition[],
> extends AnyCommandFactory {
  options(): Options;
  arguments(): Arguments;
  create():
    | Promise<ConsoleCommand<ParsedOptions<Options> & ParsedArguments<Arguments>>>
    | ConsoleCommand<ParsedOptions<Options> & ParsedArguments<Arguments>>;
}
