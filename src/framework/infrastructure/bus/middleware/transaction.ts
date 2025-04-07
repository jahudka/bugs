import type { CommandMiddleware } from '$/framework/domain/bus/commandMiddleware';
import type { EntityManager } from '$/framework/domain/orm/entityManager';

export class TransactionMiddleware implements CommandMiddleware {
  readonly priority: number = 1e5;

  constructor(private readonly em: EntityManager) {}

  async handle<Result>(_: unknown, next: () => Promise<Result>): Promise<Result> {
    const txn = this.em.getConnection().transaction(async () => {
      let flush = true;

      try {
        return await next();
      } catch (e: unknown) {
        flush = false;
        throw e;
      } finally {
        if (flush) {
          this.em.flush();
        }

        this.em.clear();
      }
    });

    return txn();
  }
}
