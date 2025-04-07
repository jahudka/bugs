import type { Database } from 'bun:sqlite';
import type { EntitySchema } from '$/framework/domain/orm/schema/entitySchema';
import type { PropertyMapper } from '$/framework/domain/orm/schema/propertyMapper';
import type { DbRecord, DbValue, Entity, EntityConstructor } from '$/framework/domain/orm/types';
import type { UnitOfWork } from '$/framework/domain/orm/unitOfWork';
import { getOrCreate } from '$/framework/library/iterables';

type EntityState<E extends Entity = any, R extends DbRecord = any> = {
  entity: E;
  originalData?: R;
};

export class BunUnitOfWork implements UnitOfWork {
  private readonly identityMap: Map<string, EntityState> = new Map();
  private readonly removed: Set<Entity> = new Set();

  constructor(
    private readonly connection: Database,
    private readonly schema: Map<EntityConstructor, EntitySchema>,
  ) {}

  persist(entity: Entity): void {
    const schema = this.getEntitySchema(entity);
    const key = `${schema.entity.name}#${this.getEntityId(schema, entity)}`;
    const existing = this.identityMap.get(key);

    if (existing) {
      existing.entity = entity;
    } else {
      this.identityMap.set(key, { entity });
    }
  }

  remove(entity: Entity): void {
    const schema = this.getEntitySchema(entity);
    this.identityMap.delete(`${schema.entity.name}#${this.getEntityId(schema, entity)}`);
    this.removed.add(entity);
  }

  hydrate<E extends Entity>(ctor: EntityConstructor<E>, record: DbRecord): E {
    const schema = this.getSchema(ctor);
    const key = `${schema.entity.name}#${this.getEntityId(schema, record)}`;
    const existing = this.identityMap.get(key);

    if (existing) {
      return existing.entity;
    }

    const entity = schema.create(record);
    this.hydrateProperty(entity, schema.identifier, record);

    for (const property of schema.properties) {
      this.hydrateProperty(entity, property, record);
    }

    this.identityMap.set(key, { entity, originalData: record });
    return entity;
  }

  clear(): void {
    this.identityMap.clear();
    this.removed.clear();
  }

  flush(): void {
    const { insert, update, remove } = this.computeChangeSet();

    const runAll = this.connection.transaction(() => {
      for (const [schema, entries] of remove) {
        const placeholders = [...new Array(entries.length).keys()].map((i) =>
          schema.identifier.cast ? schema.identifier.cast(`?${i + 1}`) : `?${i + 1}`,
        );

        this.connection
          .query(
            `
            DELETE FROM "${schema.tableName}"
            WHERE "${schema.identifier.columnName}" IN (${placeholders.join(', ')})
          `,
          )
          .run(...entries);
      }

      for (const [schema, entries] of insert) {
        const cols = [schema.identifier, ...schema.properties].map((prop) => prop.columnName);
        const params = [schema.identifier, ...schema.properties].map((prop) => prop.placeholder);
        const query = this.connection.prepare(
          `INSERT INTO "${schema.tableName}" ("${cols.join('", "')}") VALUES (${params.join(', ')})`,
        );

        for (const entry of entries) {
          query.run(entry);
        }
      }

      for (const [schema, entries] of update) {
        const id = schema.identifier.columnName;

        for (const entry of entries) {
          const set = Object.keys(entry)
            .filter((col) => col !== id)
            .map((col) => `"${col}" = ${schema.col(col).placeholder}`);

          this.connection
            .query(
              `
              UPDATE "${schema.tableName}" SET ${set.join(', ')}
              WHERE "${schema.identifier.columnName}" = ${schema.identifier.placeholder}
            `,
            )
            .run(entry);
        }
      }
    });

    try {
      runAll();
    } catch (e: unknown) {
      this.clear();
      throw e;
    }
  }

  private getEntitySchema<E extends Entity>(entity: E): EntitySchema<E> {
    return this.getSchema(entity.constructor as EntityConstructor<E>);
  }

  private getSchema<E extends Entity>(entity: EntityConstructor<E>): EntitySchema<E> {
    do {
      const schema = this.schema.get(entity);

      if (schema) {
        return schema;
      }

      entity = Object.getPrototypeOf(entity);
    } while (entity);

    throw new Error('Unknown entity');
  }

  private getEntityId<E extends Entity>(
    schema: EntitySchema<E>,
    entity: E | DbRecord,
  ): string | number {
    if (entity instanceof schema.entity) {
      return (entity as any)[schema.identifier.name];
    } else {
      return (entity as any)[schema.identifier.columnName];
    }
  }

  private hydrateProperty(entity: any, property: PropertyMapper, record: DbRecord): void {
    const value = record[property.columnName];
    entity[property.name] = value === null ? undefined : property.fromDb(value);
  }

  private computeChangeSet() {
    const insert: Map<EntitySchema, DbRecord[]> = new Map();
    const update: Map<EntitySchema, DbRecord[]> = new Map();
    const remove: Map<EntitySchema, DbValue[]> = new Map();

    for (const entry of this.identityMap.values()) {
      const schema = this.getEntitySchema(entry.entity);
      const currentData = this.serialize(schema, entry.entity);
      let changes: DbRecord | undefined;

      if (!entry.originalData) {
        getOrCreate(insert, schema, () => []).push(currentData);
      } else if (
        (changes = this.computeChanges(schema, currentData, entry.originalData)) !== undefined
      ) {
        getOrCreate(update, schema, () => []).push({
          [schema.identifier.columnName]: currentData[schema.identifier.name],
          ...changes,
        });
      } else {
        continue;
      }

      entry.originalData = currentData;
    }

    for (const entity of this.removed) {
      const schema = this.getEntitySchema(entity);
      const id = this.serializeProperty(entity, schema.identifier);
      getOrCreate(remove, schema, () => []).push(id);
    }

    this.removed.clear();

    return { insert, update, remove };
  }

  private computeChanges(
    schema: EntitySchema,
    current: DbRecord,
    original: DbRecord,
  ): DbRecord | undefined {
    const changes: DbRecord = {};
    let hasChanges = false;

    for (const property of schema.properties) {
      const ov = original[property.columnName] ?? null;
      const cv = current[property.columnName] ?? null;

      if (
        ov !== cv &&
        (!property.isSame || ov === null || cv === null || !property.isSame(ov, cv))
      ) {
        changes[property.columnName] = cv;
        hasChanges = true;
      }
    }

    return hasChanges ? changes : undefined;
  }

  private serialize<E extends Entity>(schema: EntitySchema<E>, entity: E): DbRecord {
    const record: DbRecord = {};
    record[schema.identifier.columnName] = this.serializeProperty(entity, schema.identifier);

    for (const property of schema.properties) {
      record[property.columnName] = this.serializeProperty(entity, property);
    }

    return record;
  }

  private serializeProperty(entity: any, property: PropertyMapper): DbValue {
    try {
      const value = entity[property.name];
      return value !== undefined ? property.toDb(value) : null;
    } catch (e: any) {
      console.log(entity[property.name]);
      throw new Error(
        `Error serializing ${entity.constructor.name}.${property.name}: ${e.message}`,
      );
    }
  }
}
