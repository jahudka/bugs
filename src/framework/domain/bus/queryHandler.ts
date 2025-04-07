import type { Query } from './query';

export interface QueryConstructor<Q extends Query = any> {
  new (...args: any): Q;
}

export interface AnyQueryHandlerFactory {
  readonly query: QueryConstructor;
  create(): Promise<AnyQueryHandler> | AnyQueryHandler;
}

export interface QueryHandlerFactory<Q extends Query> extends AnyQueryHandlerFactory {
  readonly query: QueryConstructor<Q>;
  create(): Promise<QueryHandler<Q>> | QueryHandler<Q>;
}

export interface AnyQueryHandler {
  handle(query: Query): Promise<unknown> | unknown;
}

export interface QueryHandler<Q extends Query> extends AnyQueryHandler {
  handle(query: Q): QueryResult<Q>;
}

type QueryResult<Q extends Query> = Q extends Query<infer R> ? Promise<R> | R : never;
