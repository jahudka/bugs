import {
  $arg,
  type ArgumentDefinition,
  type OptionDefinition,
} from '$/framework/domain/console/args';
import type { AnyCommandFactory } from '$/framework/domain/console/commandFactory';
import type { CommandInfo } from '$/framework/domain/console/commandResolver';

export const globalOptions = [
  {
    name: 'help',
    alias: 'h',
    description: 'Show help for command',
    type: Boolean,
    defaultValue: false,
  },
  {
    // this is handled automatically by chalk, we just need to document it:
    name: 'no-color',
    description: 'Disable color output',
    type: Boolean,
  },
] as const satisfies OptionDefinition[];

export const globalArgs = [
  {
    name: 'command',
    summary: 'Command to execute',
    type: $arg.str,
  },
  {
    name: 'args',
    summary: 'Command arguments',
    type: $arg.str,
    rest: true,
  },
] as const satisfies ArgumentDefinition[];

export function compareCmd(a: AnyCommandFactory, b: AnyCommandFactory): number {
  const pa = a.name.split(/:/g);
  const pb = b.name.split(/:/g);

  if (pa.length !== pb.length) {
    return pa.length - pb.length;
  }

  for (let i = 0; i < pa.length; ++i) {
    if (pa[i] < pb[i]) {
      return -1;
    } else if (pa[i] > pb[i]) {
      return 1;
    }
  }

  return 0;
}

export function cmdRow(command: AnyCommandFactory, isDefault?: number | boolean): CommandInfo {
  return {
    name: isDefault === true ? `${command.name} {dim (default)}` : command.name,
    summary: command.description,
  };
}
