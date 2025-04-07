import type { ScopedRunner } from 'dicc';
import type { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { RequestMiddleware, RequestMiddlewareNext } from '$/framework/domain/http/types';

export class DiccHttpMiddleware implements RequestMiddleware {
  readonly priority: number = 1e6;

  constructor(private readonly runner: ScopedRunner) {}

  async handle(next: RequestMiddlewareNext): Promise<HttpResponse> {
    return this.runner.run(next);
  }
}
