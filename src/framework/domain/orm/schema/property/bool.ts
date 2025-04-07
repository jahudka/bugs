import { PropertyMapper } from '../propertyMapper';

export class Bool extends PropertyMapper<boolean, number> {
  fromDb(value: number): boolean {
    return value !== 0;
  }

  toDb(value: boolean): number {
    return value ? 1 : 0;
  }
}

export function bool(name: string, columnName?: string): Bool {
  return new Bool(name, columnName);
}
