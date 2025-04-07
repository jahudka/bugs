import { chmodSync } from 'node:fs';
import { serve } from 'bun';
import type { DaemonTask } from '$/framework/domain/daemon/daemonTask';
import type { EventDispatcher } from '$/framework/domain/event/eventDispatcher';
import { RequestEvent } from '$/framework/domain/http/events/request';
import { ResponseEvent } from '$/framework/domain/http/events/response';
import { HttpRequest } from '$/framework/domain/http/httpRequest';
import { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { Route } from '$/framework/domain/http/route';
import type { ErrorHandler, ErrorLike, RequestMiddleware } from '$/framework/domain/http/types';

export class BunHttpServer implements DaemonTask {
  private readonly withMiddlewares: MiddlewareChain;

  constructor(
    middlewares: RequestMiddleware[],
    private readonly routes: Route[],
    private readonly eventDispatcher: EventDispatcher,
    private readonly errorHandler: ErrorHandler,
    private readonly listenOn: string | number,
  ) {
    this.withMiddlewares = compileMiddlewareChain(
      middlewares.sort((a, b) => b.priority - a.priority),
    );
  }

  async run(signal: AbortSignal): Promise<void> {
    const terminated: PromiseWithResolvers<void> = Promise.withResolvers();
    signal.addEventListener('abort', () => terminated.resolve());

    const opts =
      typeof this.listenOn === 'number'
        ? { hostname: '127.0.0.1', port: this.listenOn }
        : { unix: this.listenOn };

    this.routes.sort((a, b) => b.priority - a.priority);

    const server = serve({
      ...opts,
      fetch: async (request) => this.handleRequest(new HttpRequest(request)),
      error: async (error) => this.handleError(error),
      ['idleTimeout' as any]: 240,
    });

    if (typeof this.listenOn === 'string') {
      chmodSync(this.listenOn, 0o660);
    }

    await terminated.promise;

    for (const route of this.routes) {
      await route.terminate?.();
    }

    await server.stop();
  }

  private async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const [route, match] = this.route(request);

    return this.withMiddlewares(request, route, async () => {
      let response: HttpResponse;

      try {
        await this.eventDispatcher.dispatch(new RequestEvent(request));

        response = (await route?.handle(request, match)) ?? new HttpResponse(null, { status: 404 });
      } catch (e: any) {
        response = await this.errorHandler.handle(e, request);
      }

      await this.eventDispatcher.dispatch(new ResponseEvent(response, request));
      return this.finaliseResponse(response);
    });
  }

  private async handleError(error: ErrorLike): Promise<HttpResponse> {
    return this.finaliseResponse(await this.errorHandler.handle(error));
  }

  private finaliseResponse(response: HttpResponse): HttpResponse {
    const cookies = response.ejectCookies();

    if (cookies.length) {
      response.headers.set('set-cookie', cookies.join(', '));
    }

    return response;
  }

  private route(request: HttpRequest): [route: Route, match?: RegExpMatchArray] | [] {
    let match: RegExpMatchArray | boolean | undefined | null;

    for (const route of this.routes) {
      if ((match = route.match(request))) {
        return [route, match !== true ? match : undefined];
      }
    }

    return [];
  }
}

type MiddlewareChain = (
  request: HttpRequest,
  route: Route | undefined,
  handler: () => Promise<HttpResponse>,
) => Promise<HttpResponse>;

function compileMiddlewareChain(middlewares: RequestMiddleware[]): MiddlewareChain {
  const ids = [...new Array(middlewares.length).keys()];
  const args = ids.map((i) => `mw${i}`);
  const calls = ids.reduceRight(
    (src, i) => `mw${i}.handle(${src !== 'handler' ? 'async () => ' : ''}${src}, request, route)`,
    'handler',
  );

  const createChain = new Function(...args, `return (request, route, handler) => ${calls}`);
  return createChain(...middlewares);
}
