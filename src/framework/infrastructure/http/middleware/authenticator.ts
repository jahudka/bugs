import type { EventDispatcher } from '$/framework/domain/event/eventDispatcher';
import type { HttpRequest } from '$/framework/domain/http/httpRequest';
import type { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { RequestMiddleware, RequestMiddlewareNext } from '$/framework/domain/http/types';
import type { Authenticator } from '$/framework/domain/security/authenticator';
import { AuthenticationFailure } from '$/framework/domain/security/errors';
import { AuthenticationFailureEvent } from '$/framework/domain/security/events/failure';
import { AuthenticationSuccessEvent } from '$/framework/domain/security/events/success';
import type { Identity } from '$/framework/domain/security/identity';

export class AuthenticatorMiddleware implements RequestMiddleware {
  readonly priority: number = 1e4;

  constructor(
    private readonly eventDispatcher: EventDispatcher,
    private readonly authenticators: Authenticator[],
    private readonly registerIdentity: (identity: Identity) => void,
  ) {
    this.authenticators.sort((a, b) => b.priority - a.priority);
  }

  async handle(next: RequestMiddlewareNext, request: HttpRequest): Promise<HttpResponse> {
    const authenticator = this.authenticators.find((authenticator) =>
      authenticator.supports(request),
    );

    if (!authenticator) {
      throw new AuthenticationFailure();
    }

    try {
      const identity = await authenticator.authenticate(request);
      this.registerIdentity(identity);
      await this.eventDispatcher.dispatch(new AuthenticationSuccessEvent(request, identity));
    } catch (e: unknown) {
      await this.eventDispatcher.dispatch(new AuthenticationFailureEvent(request));

      if (e instanceof AuthenticationFailure && e.response) {
        return e.response;
      } else {
        throw e;
      }
    }

    return next();
  }
}
