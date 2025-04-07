import type { AnyCommandFactory } from './commandFactory';

export class AmbiguousCommandError extends Error {
  constructor(
    readonly command: string,
    readonly candidates: AnyCommandFactory[],
  ) {
    super();
  }
}
