import type { HttpRequest } from '$/framework/domain/http/httpRequest';
import { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { Route } from '$/framework/domain/http/route';
import type { RequestMiddleware, RequestMiddlewareNext } from '$/framework/domain/http/types';
import { getOrCreate } from '$/framework/library/iterables';
import { BaseRoute } from '../baseRoute';

export class CorsMiddleware implements RequestMiddleware {
  readonly priority: number = 1e5;

  private readonly routeMethods: WeakMap<Route, string> = new WeakMap();

  async handle(
    next: RequestMiddlewareNext,
    request: HttpRequest,
    route?: Route,
  ): Promise<HttpResponse> {
    const response = request.method === 'OPTIONS' ? new HttpResponse() : await next();

    if (!response.headers.has('access-control-allow-origin')) {
      response.headers.set('access-control-allow-origin', request.headers.get('origin') ?? '*');
    }

    if (!response.headers.has('access-control-allow-credentials')) {
      response.headers.set('access-control-allow-credentials', 'true');
    }

    if (!response.headers.has('access-control-allow-methods')) {
      response.headers.set(
        'access-control-allow-methods',
        route
          ? getOrCreate(this.routeMethods, route, () => this.getAllowedMethods(route))
          : 'GET, OPTIONS',
      );
    }

    if (!response.headers.has('access-control-allow-headers')) {
      response.headers.set(
        'access-control-allow-headers',
        request.headers.get('access-control-request-headers') ?? 'content-type',
      );
    }

    if (!response.headers.has('access-control-max-age')) {
      response.headers.set('access-control-max-age', '3600');
    }

    const vary = response.headers.get('vary');
    response.headers.set('vary', vary !== null ? `origin, ${vary}` : 'origin');
    return response;
  }

  private getAllowedMethods(route: Route): string {
    let methods = (route instanceof BaseRoute ? route.methods : undefined) ?? ['GET', 'OPTIONS'];

    if (!Array.isArray(methods)) {
      methods = methods.split(/\s*,\s*/g);
    }

    return [...new Set(methods.concat('OPTIONS'))].join(', ').toUpperCase();
  }
}
