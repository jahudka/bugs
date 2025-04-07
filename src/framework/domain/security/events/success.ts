import { AsyncEvent } from '$/framework/domain/event/asyncEvent';
import type { HttpRequest } from '$/framework/domain/http/httpRequest';
import type { Identity } from '../identity';

export class AuthenticationSuccessEvent extends AsyncEvent {
  constructor(
    readonly request: HttpRequest,
    readonly identity: Identity,
  ) {
    super();
  }
}
