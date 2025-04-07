import type { HttpRequest } from './httpRequest';
import type { HttpResponse } from './httpResponse';
import type { Route } from './route';

export type ErrorLike = Error & {
  code?: string;
  errno?: number;
  syscall?: string;
};

export interface ErrorHandler {
  handle(error: ErrorLike, request?: HttpRequest): Promise<HttpResponse> | HttpResponse;
}

export interface RequestMiddleware {
  readonly priority: number;
  handle(next: RequestMiddlewareNext, request: HttpRequest, route?: Route): Promise<HttpResponse>;
}

export type RequestMiddlewareNext = () => Promise<HttpResponse>;
