import { resolve } from 'node:path';
import type { ServiceDefinition } from 'dicc';
import type { Application } from '$/framework/domain/console/application';
import type { DaemonTask } from '$/framework/domain/daemon/daemonTask';
import type { EntityManager } from '$/framework/domain/orm/entityManager';
import { DefaultApplication } from '$/framework/infrastructure/console/defaultApplication';
import { BunHttpServer } from '$/framework/infrastructure/http/bunServer';
import { BunEntityManager } from '$/framework/infrastructure/orm/bunEntityManager';

export interface EnvironmentConfig {
  databaseDir: string;
  listenOn: number | string;
}

export function createConfig(): EnvironmentConfig {
  const databaseDir = resolve(process.env['DATABASE_DIR'] ?? '.');
  const rawListenOn = process.env['LISTEN_ON'] ?? '8000';
  const listenOn = /^\d+$/.test(rawListenOn) ? parseInt(rawListenOn, 10) : rawListenOn;

  return {
    databaseDir,
    listenOn,
  };
}

export const entityManager = {
  factory: BunEntityManager,
  anonymous: true,
  args: {
    databaseFile: (env: EnvironmentConfig) => resolve(env.databaseDir, 'bugs.sqlite'),
  },
  onFork: async (cb, em) => em.fork(cb),
} satisfies ServiceDefinition<EntityManager>;

export const httpServer = {
  factory: BunHttpServer,
  anonymous: true,
  args: {
    listenOn: (env: EnvironmentConfig) => env.listenOn,
  },
} satisfies ServiceDefinition<DaemonTask>;

export const application = {
  factory: DefaultApplication,
  args: {
    name: 'bugs',
    description: 'Bugs Bunny',
  },
} satisfies ServiceDefinition<Application>;
