import { strict as assert } from 'node:assert';
import type { Statement } from 'bun:sqlite';
import { map } from '$/framework/library/iterables';
import type { EntityManager } from './entityManager';
import type { DbRecord, DbValue, EntityConstructor, Property, QueryParams } from './types';

export class QueryBuilder<E extends object> implements Iterable<E> {
  constructor(
    private readonly em: EntityManager,
    private readonly entity: EntityConstructor<E>,
    private readonly sql?: string,
    private readonly parameters?: QueryParams,
  ) {}

  query(sql: string): QueryBuilder<E> {
    return new QueryBuilder(this.em, this.entity, sql, this.parameters);
  }

  bind(parameters: QueryParams): QueryBuilder<E> {
    return new QueryBuilder(this.em, this.entity, this.sql, parameters);
  }

  first(): E | undefined {
    const record = this.getQuery().get(...this.getParameters());

    return record !== null ? this.em.hydrate(this.entity, record) : undefined;
  }

  toArray(): E[] {
    return [...this];
  }

  map<Args extends any[], R>(callback: (entity: E, ...args: Args) => R, ...args: Args): R[] {
    return this.toArray().map((entity) => callback(entity, ...args));
  }

  mapBy<K extends Property<E>>(prop: K, asMap: true): Map<K, E>;
  mapBy<K extends Property<E>>(prop: K, asMap?: false): Record<K, E>;
  mapBy<K extends Property<E>>(prop: K, asMap: boolean = false): Map<K, E> | Record<K, E> {
    const entries = map(this, (e) => [e[prop], e] as const);
    return asMap ? new Map(entries) : Object.fromEntries(entries);
  }

  *[Symbol.iterator](): Iterator<E> {
    for (const record of this.getQuery().all(...this.getParameters())) {
      yield this.em.hydrate(this.entity, record);
    }
  }

  private getQuery(): Statement<DbRecord> {
    assert(this.sql !== undefined);
    return this.em.getConnection().query(this.sql);
  }

  private getParameters(): DbValue[] | [DbRecord] | [] {
    return Array.isArray(this.parameters)
      ? this.parameters
      : this.parameters
        ? [this.parameters]
        : [];
  }
}
