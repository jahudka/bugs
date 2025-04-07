import type { Database } from 'bun:sqlite';

export type EntityConstructor<E extends object = any> = abstract new (...args: any) => E;

type Callable = (...args: any) => any;

export type Property<E> = string &
  keyof {
    [K in keyof E as E[K] extends Callable ? never : K]: 0;
  };

export type DbValue = Uint8Array | string | number | bigint | null;
export type DbRecord = Record<string, DbValue>;
export type QueryParams = DbRecord | DbValue[];

export interface Migration {
  readonly version: string;
  apply(db: Database): void;
  rollBack(db: Database): void;
}
