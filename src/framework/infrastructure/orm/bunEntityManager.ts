import { AsyncLocalStorage } from 'node:async_hooks';
import { Database } from 'bun:sqlite';
import type { EntityManager } from '$/framework/domain/orm/entityManager';
import { QueryBuilder } from '$/framework/domain/orm/queryBuilder';
import type { AnyEntitySchema, EntitySchema } from '$/framework/domain/orm/schema/entitySchema';
import type { DbRecord, Entity, EntityConstructor } from '$/framework/domain/orm/types';
import type { UnitOfWork } from '$/framework/domain/orm/unitOfWork';
import { BunUnitOfWork } from './bunUnitOfWork';

export class BunEntityManager implements EntityManager {
  private readonly connection: Database;
  private readonly schema: Map<EntityConstructor, EntitySchema>;
  private readonly context: AsyncLocalStorage<UnitOfWork> = new AsyncLocalStorage();

  constructor(databaseFile: string, schema: AnyEntitySchema[]) {
    this.connection = this.createConnection(databaseFile);
    this.schema = new Map(schema.map((s) => [s.entity, s]));
  }

  getConnection(): Database {
    return this.connection;
  }

  createBuilder<E extends Entity>(entity: EntityConstructor<E>): QueryBuilder<E> {
    return new QueryBuilder(this, entity);
  }

  find<E extends Entity>(entity: EntityConstructor<E>, id: string | number): E | undefined {
    const schema = this.getEntitySchema(entity);
    const col = schema.identifier.columnName;

    return this.createBuilder(entity)
      .query(`SELECT * FROM "${schema.tableName}" WHERE "${col}" = :id`)
      .bind({ id })
      .first();
  }

  persist(entity: Entity): void {
    this.getUnitOfWork().persist(entity);
  }

  remove(entity: Entity): void {
    this.getUnitOfWork().remove(entity);
  }

  flush(): void {
    this.getUnitOfWork().flush();
  }

  clear(): void {
    this.getUnitOfWork().clear();
  }

  hydrate<E extends Entity>(entity: EntityConstructor<E>, record: DbRecord): E {
    return this.getUnitOfWork().hydrate(entity, record);
  }

  getEntitySchema<E extends Entity>(entity: EntityConstructor<E>): EntitySchema<E> {
    const schema = this.schema.get(entity);

    if (!schema) {
      throw new Error('Unknown entity type');
    }

    return schema;
  }

  async fork<R>(cb: () => R | Promise<R>): Promise<R> {
    return this.context.run(new BunUnitOfWork(this.connection, this.schema), cb);
  }

  private createConnection(file: string): Database {
    const connection = new Database(file, {
      strict: true,
      create: true,
    });

    connection.run('PRAGMA journal_mode = WAL');
    connection.run('PRAGMA foreign_keys = ON');
    return connection;
  }

  private getUnitOfWork(): UnitOfWork {
    const uow = this.context.getStore();

    if (!uow) {
      throw new Error('Cannot use entity manager in global context');
    }

    return uow;
  }
}
