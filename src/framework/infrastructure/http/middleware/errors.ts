import { ZodError } from 'zod';
import { HttpResponse } from '$/framework/domain/http/httpResponse';
import type { RequestMiddleware, RequestMiddlewareNext } from '$/framework/domain/http/types';
import { EntityNotFound } from '$/framework/domain/orm/errors';
import { AuthenticationFailure } from '$/framework/domain/security/errors';

export class ErrorsMiddleware implements RequestMiddleware {
  readonly priority: number = 1e5 - 1;

  async handle(next: RequestMiddlewareNext): Promise<HttpResponse> {
    try {
      return await next();
    } catch (e: unknown) {
      if (e instanceof EntityNotFound) {
        return new HttpResponse(null, { status: 404 });
      }

      if (e instanceof AuthenticationFailure) {
        return new HttpResponse(null, { status: 403 });
      }

      if (e instanceof ZodError) {
        return new HttpResponse(null, { status: 400 });
      }

      throw e;
    }
  }
}
