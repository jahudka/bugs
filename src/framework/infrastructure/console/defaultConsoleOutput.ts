import commandLineUsage from 'command-line-usage';
import { vsprintf } from 'printj';
import type { OptionDefinition } from '$/framework/domain/console/args';
import type { ConsoleOutput } from '$/framework/domain/console/consoleOutput';

export class DefaultConsoleOutput implements ConsoleOutput {
  constructor(private readonly stream: NodeJS.WriteStream = process.stdout) {}

  to(stream: NodeJS.WriteStream): ConsoleOutput {
    return new DefaultConsoleOutput(stream);
  }

  raw(content: Buffer | string): this {
    this.stream.write(content);
    return this;
  }

  log(message: string, ...args: any[]): this {
    return this.write({
      content: this.format(message, args),
    });
  }

  header(text: string, ...args: any[]): this {
    return this.write({
      header: this.format(text, args),
    });
  }

  list(items: string[]): this;
  list(...items: string[]): this;
  list(first: string[] | string = [], ...rest: string[]): this {
    const items = Array.isArray(first) ? first : [first, ...rest];

    return this.write({
      content: items.map((item) => `- ${item}`),
    });
  }

  table<Row extends Record<string, any>>(rows: Row[]): this;
  table<Row extends Record<string, any>>(...rows: Row[]): this;
  table<Row extends Record<string, any>>(first: Row[] | Row = [], ...rest: Row[]): this {
    const rows = Array.isArray(first) ? first : [first, ...rest];
    return this.write({ content: rows });
  }

  options(options: OptionDefinition[]): this;
  options(...options: OptionDefinition[]): this;
  options(first: OptionDefinition[] | OptionDefinition, ...rest: OptionDefinition[]): this {
    const options = Array.isArray(first) ? first : [first, ...rest];
    return this.write({ optionList: options, reverseNameOrder: true });
  }

  private write(section: any): this {
    const content = commandLineUsage(section)
      .replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, '')
      .concat('\n\n');

    this.stream.write(content);
    return this;
  }

  private format(message: string, args: any[]): string {
    return args.length ? vsprintf(message, args) : message;
  }

  close(): void {
    this.stream.end();
  }
}
