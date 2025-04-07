import { Cookie, type CookieOptions } from './cookie';

export class HttpResponse extends Response {
  readonly #cookies: Map<string, Cookie> = new Map();

  setCookie(cookie: Cookie): void;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  setCookie(
    cookieOrName: Cookie | string,
    maybeValue?: string,
    maybeOptions?: CookieOptions,
  ): void {
    if (typeof cookieOrName === 'string') {
      this.#cookies.set(cookieOrName, new Cookie(cookieOrName, maybeValue!, maybeOptions));
    } else {
      this.#cookies.set(cookieOrName.name, cookieOrName);
    }
  }

  ejectCookies(): Cookie[] {
    const cookies = [...this.#cookies.values()];
    this.#cookies.clear();
    return cookies;
  }
}
