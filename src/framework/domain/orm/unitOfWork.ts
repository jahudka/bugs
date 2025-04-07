import type { DbRecord, EntityConstructor } from './types';

export interface UnitOfWork {
  persist(entity: object): void;
  remove(entity: object): void;
  hydrate<E extends object>(ctor: EntityConstructor<E>, record: DbRecord): E;
  clear(): void;
  flush(): void;
}
