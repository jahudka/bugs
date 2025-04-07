import type { DbRecord, EntityConstructor } from '../types';
import type { PropertyMapper } from './propertyMapper';

export interface AnyEntitySchema {
  readonly entity: EntityConstructor;
  readonly tableName: string;
  readonly identifier: PropertyMapper;
  readonly properties: Iterable<PropertyMapper>;

  create(record: DbRecord): object;
  prop(name: string): PropertyMapper;
  col(name: string): PropertyMapper;
}

export interface EntitySchema<E extends object = any> extends AnyEntitySchema {
  readonly entity: EntityConstructor<E>;

  create(record: DbRecord): E;
}
