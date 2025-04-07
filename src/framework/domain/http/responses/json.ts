import { HttpResponse } from '../httpResponse';

export class JsonResponse extends HttpResponse {
  constructor(payload: any, init?: ResponseInit) {
    super(JSON.stringify(payload), init);

    if (!this.headers.has('content-type')) {
      this.headers.set('content-type', 'application/json');
    }
  }
}
