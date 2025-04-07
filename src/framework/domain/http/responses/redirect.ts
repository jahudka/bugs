import { HttpResponse } from '../httpResponse';

export type RedirectInit = Omit<ResponseInit, 'status' | 'statusText'>;

export class RedirectResponse extends HttpResponse {
  constructor(url: string, init?: RedirectInit);
  constructor(status: number, url: string, init?: RedirectInit);
  constructor(statusOrUrl: any, urlOrInit?: any, maybeInit?: any) {
    const [status, url, init]: [number, string, RedirectInit | undefined] =
      typeof statusOrUrl === 'number'
        ? [statusOrUrl, urlOrInit, maybeInit]
        : [302, statusOrUrl, urlOrInit];

    super(null, {
      ...init,
      status,
    });

    this.headers.set('location', url);
  }
}
