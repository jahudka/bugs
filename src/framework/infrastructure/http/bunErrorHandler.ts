import { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { ErrorHandler, ErrorLike } from '$/framework/domain/http/types';

export class BunErrorHandler implements ErrorHandler {
  handle(error: ErrorLike): Promise<HttpResponse> | HttpResponse {
    console.log(new Date(), error);
    return new HttpResponse(null, { status: 500 });
  }
}
