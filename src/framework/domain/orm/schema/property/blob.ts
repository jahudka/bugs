import { PropertyMapper } from '../propertyMapper';

export class Blob_ extends PropertyMapper<Uint8Array, Uint8Array> {
  fromDb(value: Uint8Array): Uint8Array {
    return value;
  }

  toDb(value: Uint8Array): Uint8Array {
    return value;
  }

  isSame(a: Uint8Array, b: Uint8Array): boolean {
    return Buffer.from(a).equals(b);
  }
}

export function blob(name: string, columnName?: string): Blob_ {
  return new Blob_(name, columnName);
}
