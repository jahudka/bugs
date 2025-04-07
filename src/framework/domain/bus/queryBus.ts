import type { Query } from './query';

export interface QueryBus {
  handle<Result>(query: Query<Result>): Promise<Result>;
}
