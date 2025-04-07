export interface Application {
  readonly name: string;
  readonly description: string;
  run(args: string[]): Promise<number>;
}
