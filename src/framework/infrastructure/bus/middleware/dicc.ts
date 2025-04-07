import type { ScopedRunner } from 'dicc';
import type { CommandMiddleware } from '$/framework/domain/bus/commandMiddleware';
import type { QueryMiddleware } from '$/framework/domain/bus/queryMiddleware';

export class DiccBusMiddleware implements CommandMiddleware, QueryMiddleware {
  readonly priority: number = 1e6;

  constructor(private readonly runner: ScopedRunner) {}

  async handle<Result>(_: unknown, next: () => Promise<Result>): Promise<Result> {
    return this.runner.run(next);
  }
}
