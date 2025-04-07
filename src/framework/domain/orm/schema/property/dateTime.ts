import { PropertyMapper } from '../propertyMapper';

export type DateTimeOptions = {
  columnName?: string;
  fractional?: boolean;
};

export class DateTime extends PropertyMapper<Date, string> {
  private readonly modifiers: string;

  constructor(
    name: string,
    { columnName, fractional }: DateTimeOptions,
    private readonly castFn: string,
    private fromDbFormat: (value: string) => string,
  ) {
    super(name, columnName);
    this.modifiers = fractional ? `, 'subsec'` : '';
  }

  fromDb(value: string): Date {
    return new Date(this.fromDbFormat(value));
  }

  toDb(value: Date): string {
    return value.toISOString();
  }

  cast(value: string): string {
    return `${this.castFn}(${value}${this.modifiers})`;
  }
}

export class Timestamp extends PropertyMapper<Date, number> {
  private readonly fractional: boolean;

  constructor(name: string, { columnName, fractional }: DateTimeOptions = {}) {
    super(name, columnName);
    this.fractional = fractional ?? false;
  }

  fromDb(value: number): Date {
    return new Date(+value * 1000);
  }

  toDb(value: Date): number {
    return this.fractional ? value.getTime() / 1000 : Math.floor(value.getTime() / 1000);
  }
}

export function date(name: string, options: DateTimeOptions = {}): DateTime {
  return new DateTime(name, options, 'date', (value) => `${value}T00:00:00.000Z`);
}

export function time(name: string, options: DateTimeOptions = {}): DateTime {
  return new DateTime(name, options, 'time', (value) => `2020-01-01T${value}Z`);
}

export function datetime(name: string, options: DateTimeOptions = {}): DateTime {
  return new DateTime(name, options, 'datetime', (value) => `${value}Z`);
}

export function timestamp(name: string, options: DateTimeOptions = {}): Timestamp {
  return new Timestamp(name, options);
}
