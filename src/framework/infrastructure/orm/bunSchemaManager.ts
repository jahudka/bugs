import type { Database } from 'bun:sqlite';
import type { EntityManager } from '$/framework/domain/orm/entityManager';
import type { SchemaManager } from '$/framework/domain/orm/schemaManager';
import type { Migration } from '$/framework/domain/orm/types';

export class BunSchemaManager implements SchemaManager {
  constructor(
    private readonly em: EntityManager,
    private readonly migrations: Iterable<Migration>,
  ) {}

  migrate(version?: string): void {
    const conn = this.em.getConnection();
    this.ensureMigrationTableExists(conn);
    const [migrations, rollback] = this.resolveMigrationsToRun(conn, version);

    if (!migrations.length) {
      let hint: string = '';

      switch (version) {
        case 'prev':
          break;
        case undefined:
          hint = ', already at latest version';
          break;
        default:
          hint = `, already at version ${version}`;
          break;
      }

      console.log(`No migrations to perform${hint}`);
      return;
    }

    for (const migration of migrations) {
      this.apply(conn, migration, rollback);
    }
  }

  private ensureMigrationTableExists(conn: Database): void {
    conn.run(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "version" TEXT NOT NULL PRIMARY KEY
      )
    `);
  }

  private resolveMigrationsToRun(
    conn: Database,
    version?: string,
  ): [versions: Migration[], rollback: boolean] {
    const migrations = [...this.migrations].sort((a, b) =>
      a.version < b.version ? -1 : a.version > b.version ? 1 : 0,
    );

    const latest = conn
      .query('SELECT "version" FROM "migrations" ORDER BY "version" DESC LIMIT 1')
      .get() as { version: string } | undefined;

    const startAt = latest ? findIdx(latest.version) + 1 : 0;
    const endAt =
      version !== undefined
        ? version === 'prev'
          ? startAt - 1
          : findIdx(version) + 1
        : migrations.length;

    return [migrations.slice(Math.min(startAt, endAt), Math.max(startAt, endAt)), endAt < startAt];

    function findIdx(version: string): number {
      return migrations.findIndex((m) => m.version === version);
    }
  }

  private apply(conn: Database, migration: Migration, rollback: boolean = false): void {
    conn
      .transaction(() => {
        console.log(
          `${rollback ? 'Rolling back' : 'Applying'} migration '${migration.version}'...`,
        );

        if (rollback) {
          migration.rollBack(conn);
        } else {
          migration.apply(conn);
        }

        const query = rollback
          ? 'DELETE FROM "migrations" WHERE "version" = :version'
          : 'INSERT INTO "migrations" ("version") VALUES (:version)';
        conn.query(query).run({ version: migration.version });

        console.log(
          `Successfully ${rollback ? 'rolled back' : 'applied'} version '${migration.version}'.`,
        );
      })
      .exclusive();
  }
}
