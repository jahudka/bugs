import type { Query } from '$/framework/domain/bus/query';
import type { QueryBus } from '$/framework/domain/bus/queryBus';
import type { AnyQueryHandlerFactory, QueryConstructor } from '$/framework/domain/bus/queryHandler';
import type { QueryMiddleware } from '$/framework/domain/bus/queryMiddleware';
import { compileMiddlewareChain } from './utils';

export class DefaultQueryBus implements QueryBus {
  private readonly handlers: Map<QueryConstructor, AnyQueryHandlerFactory>;
  private readonly withMiddlewares: <Result>(
    query: Query<Result>,
    handle: () => Promise<Result>,
  ) => Promise<Result>;

  constructor(handlers: AnyQueryHandlerFactory[], middlewares: QueryMiddleware[] = []) {
    this.handlers = new Map(handlers.map((h) => [h.query, h]));
    this.withMiddlewares = compileMiddlewareChain(middlewares);
  }

  async handle<Result>(query: Query<Result>): Promise<Result> {
    const factory = this.handlers.get(query.constructor as QueryConstructor);

    if (!factory) {
      throw new Error(`Unsupported query: ${query.constructor.name}`);
    }

    return this.withMiddlewares(query, async () => {
      const handler = await factory.create();
      return handler.handle(query) as Result;
    });
  }
}
