import { AsyncEvent } from '$/framework/domain/event/asyncEvent';
import type { HttpRequest } from '$/framework/domain/http/httpRequest';

export class AuthenticationFailureEvent extends AsyncEvent {
  constructor(readonly request: HttpRequest) {
    super();
  }
}
