import type { HttpRequest } from './httpRequest';
import type { HttpResponse } from './httpResponse';

export interface Route {
  readonly priority: number;

  match(request: HttpRequest): RegExpMatchArray | boolean | undefined | null;
  handle(request: HttpRequest, match?: RegExpMatchArray): Promise<HttpResponse> | HttpResponse;
  terminate?(): Promise<void> | void;
}
