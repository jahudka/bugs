import { PropertyMapper } from '../propertyMapper';

export class String_ extends PropertyMapper<string, string> {
  fromDb(value: string): string {
    return value;
  }

  toDb(value: string): string {
    return value;
  }
}

export function string(name: string, columnName?: string): String_ {
  return new String_(name, columnName);
}
