import { snake } from './utils';

export abstract class PropertyMapper<
  Type = any,
  DbType extends Uint8Array | string | number | bigint = any,
> {
  readonly columnName: string;

  constructor(
    readonly name: string,
    columnName?: string,
  ) {
    this.columnName = columnName ?? snake(this.name);
  }

  abstract fromDb(value: DbType): Type;
  abstract toDb(value: Type): DbType;

  get placeholder(): string {
    const placeholder = `:${this.columnName}`;
    return this.cast ? this.cast(placeholder) : placeholder;
  }

  cast?(value: string): string;
  isSame?(a: DbType, b: DbType): boolean;
}
