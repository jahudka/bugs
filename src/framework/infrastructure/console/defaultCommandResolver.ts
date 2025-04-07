import { filterMap } from 'dicc-cli';
import { BadArgumentError } from '$/framework/domain/console/args';
import type { AnyCommandFactory } from '$/framework/domain/console/commandFactory';
import type { CommandInfo, CommandResolver } from '$/framework/domain/console/commandResolver';
import { AmbiguousCommandError } from '$/framework/domain/console/errors';
import { getOrCreate } from '$/framework/library/iterables';
import { cmdRow, compareCmd } from './utils';

export class DefaultCommandResolver implements CommandResolver {
  private readonly commands: Map<string, AnyCommandFactory>;
  private readonly defaultCommand: AnyCommandFactory | undefined = undefined;

  constructor(commands: AnyCommandFactory[], defaultCommand?: string) {
    this.commands = new Map(commands.map((command) => [command.name, command]));
    this.defaultCommand = defaultCommand
      ? getOrCreate(this.commands, defaultCommand, () => {
          throw new Error(`Unknown default command: ${defaultCommand}`);
        })
      : this.commands.get('list');
  }

  public getCommandList(): CommandInfo[] {
    const commands = [...this.commands.values()]
      .filter((cmd) => cmd.name !== this.defaultCommand?.name)
      .sort(compareCmd)
      .map(cmdRow);

    return this.defaultCommand ? [cmdRow(this.defaultCommand, true), ...commands] : commands;
  }

  public resolve(command?: string): AnyCommandFactory {
    if (command === undefined) {
      if (this.defaultCommand) {
        return this.defaultCommand;
      }

      throw new BadArgumentError(`Missing command`);
    }

    const pattern = new RegExp(
      `^${command.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&').replace(/:/g, '[^:]*:')}`,
    );

    const candidates = [...filterMap(this.commands, (_, cmd) => pattern.test(cmd)).values()];

    switch (candidates.length) {
      case 0:
        throw new BadArgumentError(`Unknown command: ${command}`);
      case 1:
        return candidates[0];
      default:
        throw new AmbiguousCommandError(command, candidates);
    }
  }
}
