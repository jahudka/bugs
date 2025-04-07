import { PropertyMapper } from '../propertyMapper';

export class Number_ extends PropertyMapper<number, number> {
  fromDb(value: number): number {
    return value;
  }

  toDb(value: number): number {
    return value;
  }
}

export function number(name: string, columnName?: string): Number_ {
  return new Number_(name, columnName);
}
