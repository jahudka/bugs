import { AsyncEvent } from '$/framework/domain/event/asyncEvent';
import type { HttpRequest } from '../httpRequest';

export class RequestEvent extends AsyncEvent {
  constructor(readonly request: HttpRequest) {
    super();
  }
}
