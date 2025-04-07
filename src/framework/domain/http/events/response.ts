import { AsyncEvent } from '$/framework/domain/event/asyncEvent';
import type { HttpRequest } from '../httpRequest';
import type { HttpResponse } from '../httpResponse';

export class ResponseEvent extends AsyncEvent {
  constructor(
    readonly response: HttpResponse,
    readonly request: HttpRequest,
  ) {
    super();
  }
}
