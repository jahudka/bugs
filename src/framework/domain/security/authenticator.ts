import type { HttpRequest } from '$/framework/domain/http/httpRequest';
import type { Identity } from './identity';

export interface Authenticator {
  readonly priority: number;
  supports(request: HttpRequest): boolean;
  authenticate(request: HttpRequest): Promise<Identity> | Identity;
}
