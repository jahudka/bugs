import type { OptionDefinition } from '$/framework/domain/console/args';

export interface ConsoleOutput {
  to(stream: NodeJS.WriteStream): ConsoleOutput;
  raw(content: Buffer | string): ConsoleOutput;
  log(message: string, ...args: any[]): ConsoleOutput;
  header(text: string, ...args: any[]): ConsoleOutput;
  list(items: string[]): ConsoleOutput;
  list(...items: string[]): ConsoleOutput;
  table<Row extends Record<string, any>>(rows: Row[]): ConsoleOutput;
  table<Row extends Record<string, any>>(...rows: Row[]): ConsoleOutput;
  options(options: OptionDefinition[]): ConsoleOutput;
  options(...options: OptionDefinition[]): ConsoleOutput;
  close(): void;
}
