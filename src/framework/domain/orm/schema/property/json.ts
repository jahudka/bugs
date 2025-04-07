import { PropertyMapper } from '../propertyMapper';

export class Json<Type = any> extends PropertyMapper<Type, string> {
  fromDb(value: string): Type {
    return JSON.parse(value);
  }

  toDb(value: Type): string {
    return JSON.stringify(value);
  }
}

export function json<Type = any>(name: string, columnName?: string): Json<Type> {
  return new Json(name, columnName);
}
