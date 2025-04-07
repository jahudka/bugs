import type { DbRecord, EntityConstructor } from '../types';
import type { EntitySchema } from './entitySchema';
import { $property } from './property';
import type { PropertyMapper } from './propertyMapper';
import { snake } from './utils';

export type BaseEntity = {
  readonly id: string;
};

export abstract class BaseSchema<E extends BaseEntity> implements EntitySchema<E> {
  abstract readonly entity: EntityConstructor<E>;
  readonly identifier = $property.string('id');
  readonly properties: Iterable<PropertyMapper>;
  #tableName?: string;
  #propMap: Map<string, PropertyMapper>;
  #colMap: Map<string, PropertyMapper>;

  constructor(...properties: PropertyMapper[]) {
    this.properties = properties;
    this.#propMap = new Map(properties.map((p) => [p.name, p]));
    this.#colMap = new Map(properties.map((p) => [p.columnName, p]));
  }

  get tableName(): string {
    return (this.#tableName ??= snake(this.entity.name));
  }

  /* eslint-disable-next-line unused-imports/no-unused-vars */
  create(_: DbRecord): E {
    return Object.create(this.entity.prototype);
  }

  prop(name: string): PropertyMapper {
    const prop = this.#propMap.get(name);

    if (!prop) {
      throw new Error(`Unknown property: '${name}'`);
    }

    return prop;
  }

  col(name: string): PropertyMapper {
    const col = this.#colMap.get(name);

    if (!col) {
      throw new Error(`Unknown column: '${name}'`);
    }

    return col;
  }
}
