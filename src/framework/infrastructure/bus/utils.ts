import type { Command } from '$/framework/domain/bus/command';
import type { CommandMiddleware } from '$/framework/domain/bus/commandMiddleware';
import type { Query } from '$/framework/domain/bus/query';
import type { QueryMiddleware } from '$/framework/domain/bus/queryMiddleware';

export type CommandMiddlewareChain = <Result>(
  command: Command<Result>,
  handler: () => Promise<Result> | Result,
) => Promise<Result>;
export type QueryMiddlewareChain = <Result>(
  query: Query<Result>,
  handler: () => Promise<Result> | Result,
) => Promise<Result>;

export function compileMiddlewareChain(middlewares: CommandMiddleware[]): CommandMiddlewareChain;
export function compileMiddlewareChain(middlewares: QueryMiddleware[]): QueryMiddlewareChain;
export function compileMiddlewareChain(middlewares: AnyMiddleware[]): AnyChain {
  const ids = [...new Array(middlewares.length).keys()];
  const args = ids.map((i) => `mw${i}`);
  const calls = ids.reduceRight(
    (src, i) => `mw${i}.handle(value, ${src !== 'handler' ? 'async () => ' : ''}${src})`,
    'handler',
  );

  const createChain = new Function(...args, `return (value, handler) => ${calls}`);
  return createChain(...middlewares.toSorted((a, b) => b.priority - a.priority));
}

type AnyMiddleware = {
  priority: number;
  handle(value: any, next: () => Promise<any>): Promise<any>;
};

type AnyChain = (value: any, handler: () => Promise<any> | any) => Promise<any>;
