export interface SchemaManager {
  migrate(version?: string): void;
}
