import commandLineArgs from 'command-line-args';

type CommonDefinitionProps<Name extends string, Type> = {
  name: Name;
  type: (value: string) => Type;
};

type OptionDefinitionProps<Name extends string, Type> = CommonDefinitionProps<Name, Type> & {
  alias?: string;
  typeLabel?: string;
  description?: string;
};

export type SingleOptionDefinition<
  Name extends string = string,
  Type = any,
> = OptionDefinitionProps<Name, Type> & {
  multiple?: false;
  defaultValue?: Type;
};

export type MultipleOptionDefinition<
  Name extends string = string,
  Type = any,
> = OptionDefinitionProps<Name, Type> & {
  multiple: true;
  defaultValue?: Type[];
};

export type OptionDefinition<Name extends string = string, Type = any> =
  | SingleOptionDefinition<Name, Type>
  | MultipleOptionDefinition<Name, Type>;

export type ArgumentDefinition<Name extends string = string, Type = any> = CommonDefinitionProps<
  Name,
  Type
> & {
  summary?: string;
  required?: boolean;
  rest?: boolean;
};

type UCFirst<S extends string> = S extends `${infer C}${infer R}` ? `${Uppercase<C>}${R}` : S;
type Camel<S extends string> = S extends `${infer P}-${infer R}` ? `${P}${UCFirst<Camel<R>>}` : S;
type Name<Definition> =
  Definition extends CommonDefinitionProps<infer Name, any> ? Camel<Name> : never;
type OptionType<Definition> = Definition extends { type: (value: string) => infer Type }
  ? Definition extends { multiple: true }
    ? Type[]
    : Definition extends { defaultValue: Type }
      ? Type
      : Type | undefined
  : never;
type ArgumentType<Definition> = Definition extends { type: (value: string) => infer Type }
  ? Definition extends { rest: true }
    ? Type[]
    : Definition extends { required: true }
      ? Type
      : Type | undefined
  : never;

export type ParsedOptions<Definitions extends any[]> = Definitions extends OptionDefinition[]
  ? Definitions extends [infer First, ...infer Rest]
    ? { [N in Name<First>]: OptionType<First> } & ParsedOptions<Rest>
    : Definitions extends [infer Def]
      ? { [N in Name<Def>]: OptionType<Def> }
      : object
  : object;

export type ParsedArguments<Definitions extends any[]> = Definitions extends ArgumentDefinition[]
  ? Definitions extends [infer First, ...infer Rest]
    ? { [N in Name<First>]: ArgumentType<First> } & ParsedArguments<Rest>
    : Definitions extends [infer Def]
      ? { [N in Name<Def>]: ArgumentType<Def> }
      : object
  : object;

export const $arg = {
  str: (value: string) => value,
  int: (value: string) => parseInt(value, 10),
  float: (value: string) => parseFloat(value),
  bool: function Boolean() {
    return true;
  },
};

export class BadArgumentError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export function parseArgs<const Opts extends OptionDefinition[]>(
  argv: string[],
  options: Opts,
): ParsedOptions<Opts>;
export function parseArgs<
  const Opts extends OptionDefinition[],
  const Args extends ArgumentDefinition[],
>(argv: string[], options: Opts, args: Args): ParsedOptions<Opts> & ParsedArguments<Args>;
export function parseArgs(
  argv: string[],
  options: OptionDefinition[],
  args: ArgumentDefinition[] = [],
): Record<string, any> {
  try {
    const { _unknown = [], ...opts } = commandLineArgs(options.map(lazyMultiple), {
      argv,
      camelCase: true,
      partial: true,
    });

    return {
      ...opts,
      ...processArgs(_unknown, args),
    };
  } catch (e: any) {
    switch (e.name) {
      case 'UNKNOWN_OPTION':
        throw new BadArgumentError(`Unknown option: ${e.optionName}`);
      case 'UNKNOWN_VALUE':
        throw new BadArgumentError(`Unknown argument: ${e.value}`);
      case 'ALREADY_SET':
        throw new BadArgumentError(`The '${e.optionName}' option can only be specified once`);
      default:
        throw e;
    }
  }
}

function processArgs(args: string[], defs: ArgumentDefinition[]): Record<string, any> {
  const opts: Record<string, any> = {};
  let required = true;
  let rest = false;

  for (let i = 0; i < defs.length; ++i) {
    const def = defs[i];

    if (rest) {
      throw new Error(
        `Invalid argument definition: argument '${def.name}' defined after rest argument '${defs[i - 1].name}'`,
      );
    } else if (def.required && !required) {
      throw new Error(
        `Invalid argument definition: required argument '${def.name}' defined after optional argument '${defs[i - 1].name}'`,
      );
    }

    if (i < args.length) {
      if (def.rest) {
        opts[camel(def.name)] = args.slice(i).map(def.type);
        rest = true;
      } else {
        opts[camel(def.name)] = def.type(args[i]);
      }
    } else if (def.required) {
      throw new BadArgumentError(`Missing required argument '${def.name}'`);
    } else {
      opts[camel(def.name)] = def.rest ? [] : undefined;
      required = false;
    }
  }

  if (!rest && defs.length < args.length) {
    throw new BadArgumentError(`Unknown argument: '${args[defs.length]}'`);
  }

  return opts;
}

function lazyMultiple({
  multiple: lazyMultiple,
  ...option
}: OptionDefinition): commandLineArgs.OptionDefinition {
  return { ...option, lazyMultiple };
}

function camel(value: string): string {
  return value.replace(/-(.)/g, (_, c) => c.toUpperCase());
}
