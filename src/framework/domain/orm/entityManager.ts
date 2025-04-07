import type { Database } from 'bun:sqlite';
import type { QueryBuilder } from './queryBuilder';
import type { EntitySchema } from './schema/entitySchema';
import type { DbRecord, EntityConstructor } from './types';

export interface EntityManager {
  getConnection(): Database;
  createBuilder<E extends object>(entity: EntityConstructor<E>): QueryBuilder<E>;
  find<E extends object>(entity: EntityConstructor<E>, id: string | number): E | undefined;
  persist(entity: object): void;
  remove(entity: object): void;
  flush(): void;
  clear(): void;
  hydrate<E extends object>(entity: EntityConstructor<E>, record: DbRecord): E;
  getEntitySchema<E extends object>(entity: EntityConstructor<E>): EntitySchema<E>;
  fork<R>(cb: () => R | Promise<R>): Promise<R>;
}
