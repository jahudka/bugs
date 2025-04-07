import type { HttpResponse } from '$/framework/domain/http/httpResponse';

export class AuthenticationFailure extends Error {
  #response?: HttpResponse;

  static withResponse(response: HttpResponse, message?: string): AuthenticationFailure {
    const failure = new AuthenticationFailure(message);
    failure.#response = response;
    return failure;
  }

  constructor(message?: string) {
    super(message);
  }

  get response(): HttpResponse | undefined {
    return this.#response;
  }
}
