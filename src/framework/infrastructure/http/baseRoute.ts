import type { HttpRequest } from '$/framework/domain/http/httpRequest';
import type { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { Route } from '$/framework/domain/http/route';

export abstract class BaseRoute implements Route {
  readonly priority: number = 0;
  readonly path?: RegExp | string;
  readonly methods?: string | string[];

  match(request: HttpRequest): RegExpMatchArray | boolean {
    const match = (this.match = compileMatcher(this.path, this.methods));
    return match(request);
  }

  abstract handle(
    request: HttpRequest,
    match?: RegExpMatchArray,
  ): Promise<HttpResponse> | HttpResponse;
}

function compileMatcher(
  path?: RegExp | string,
  methods?: string | string[],
): (request: HttpRequest) => RegExpMatchArray | boolean {
  const code: string[] = [];
  const args: string[] = [];
  const values: any[] = [];

  if (!Array.isArray(methods)) {
    methods = (methods ?? 'GET').split(/\s*,\s*/g);
  }

  code.push(`methods.has(request.method)`);
  args.push('methods');
  values.push(new Set(methods.concat('OPTIONS').map((method) => method.toUpperCase())));

  if (typeof path === 'string') {
    code.push(`request.url.pathname === path`);
    args.push('path');
    values.push(path);
  } else if (path) {
    code.push(`request.url.pathname.match(pattern)`);
    args.push('pattern');
    values.push(path);
  }

  if (!code.length) {
    throw new Error('Invalid route: either path or method(s) must be defined');
  }

  const createMatcher = new Function(...args, `return (request) => ${code.join(' && ')}`);
  return createMatcher(...values);
}
