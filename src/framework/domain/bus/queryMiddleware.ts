import type { Query } from './query';

export interface QueryMiddleware {
  readonly priority: number;
  handle<Result>(query: Query<Result>, next: () => Promise<Result>): Promise<Result>;
}
