export class HttpRequest {
  #url?: URL;
  #method?: string;
  #cookies?: Map<string, string>;
  #body?: Promise<Blob>;

  static parseCookies(cookieHeader?: string | null) {
    const cookies: Map<string, string> = new Map();

    if (cookieHeader === undefined || cookieHeader === null || /^\s*$/.test(cookieHeader)) {
      return cookies;
    }

    for (const pair of cookieHeader.split(/\s*;\s*/g)) {
      const [name, value] = pair.split(/\s*=\s*/);
      cookies.set(name, decodeURIComponent(value));
    }

    return cookies;
  }

  readonly raw: Request;

  constructor(request: Request) {
    this.raw = request;
  }

  get method(): string {
    return (this.#method ??= this.raw.method?.toUpperCase() || 'GET');
  }

  get url(): URL {
    this.#url ??= new URL(
      this.raw.url || '/',
      `http://${this.raw.headers.get('host') ?? 'localhost'}`,
    ) as URL;
    return new URL(this.#url) as URL;
  }

  get headers(): Headers {
    return this.raw.headers as Headers;
  }

  get cookies(): Map<string, string> {
    return (this.#cookies ??= HttpRequest.parseCookies(this.raw.headers.get('cookie')));
  }

  async blob(): Promise<Blob> {
    return (this.#body ??= this.raw.blob() as Promise<Blob>);
  }

  async text(): Promise<string> {
    const blob = await this.blob();
    return blob.text();
  }

  async json(): Promise<any> {
    const blob = await this.blob();
    return blob.json();
  }

  async readable(): Promise<ReadableStream> {
    const blob = await this.blob();
    return blob.stream();
  }
}
