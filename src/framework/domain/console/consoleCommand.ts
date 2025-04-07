export interface AnyConsoleCommand {
  execute(options: any, signal: AbortSignal): Promise<number> | number;
}

export interface ConsoleCommand<Options> extends AnyConsoleCommand {
  execute(options: Options, signal: AbortSignal): Promise<number> | number;
}
