import { Container, type ServiceType } from 'dicc';
import * as migrateDbCommand0 from '../framework/application/command/migrateDbCommand';
import * as runDaemonCommand0 from '../framework/application/command/runDaemonCommand';
import * as migrateDb0 from '../framework/domain/command/migrateDb';
import * as eventDispatcher0 from '../framework/domain/event/eventDispatcher';
import type * as route0 from '../framework/domain/http/route';
import type * as entitySchema0 from '../framework/domain/orm/schema/entitySchema';
import type * as types0 from '../framework/domain/orm/types';
import type * as authenticator1 from '../framework/domain/security/authenticator';
import type * as identity0 from '../framework/domain/security/identity';
import * as defaultCommandBus0 from '../framework/infrastructure/bus/defaultCommandBus';
import * as dicc0 from '../framework/infrastructure/bus/middleware/dicc';
import * as transaction0 from '../framework/infrastructure/bus/middleware/transaction';
import * as defaultCommandResolver0 from '../framework/infrastructure/console/defaultCommandResolver';
import * as defaultConsoleOutput0 from '../framework/infrastructure/console/defaultConsoleOutput';
import * as defaultListCommand0 from '../framework/infrastructure/console/defaultListCommand';
import * as bunErrorHandler0 from '../framework/infrastructure/http/bunErrorHandler';
import * as authenticator0 from '../framework/infrastructure/http/middleware/authenticator';
import * as cors0 from '../framework/infrastructure/http/middleware/cors';
import * as dicc1 from '../framework/infrastructure/http/middleware/dicc';
import * as errors0 from '../framework/infrastructure/http/middleware/errors';
import * as bunSchemaManager0 from '../framework/infrastructure/orm/bunSchemaManager';
import * as definitions0 from './definitions';

interface PublicServices {
  'application': ServiceType<typeof definitions0.application>;
}

interface DynamicServices {
  '#AnyEntitySchema0.0': entitySchema0.AnyEntitySchema;
  '#Authenticator0.0': authenticator1.Authenticator;
  '#Identity0.0': identity0.Identity;
  '#Migration0.0': types0.Migration;
  '#Route0.0': route0.Route;
}

interface AnonymousServices {
  '#AnyCommandFactory0':
    | defaultListCommand0.DefaultListCommandFactory
    | migrateDbCommand0.MigrateDbCommandFactory
    | runDaemonCommand0.RunDaemonCommandFactory;
  '#AuthenticatorMiddleware0.0': authenticator0.AuthenticatorMiddleware;
  '#BunEntityManager0.1': ServiceType<typeof definitions0.entityManager>;
  '#BunErrorHandler0.0': bunErrorHandler0.BunErrorHandler;
  '#BunHttpServer0.1': ServiceType<typeof definitions0.httpServer>;
  '#BunSchemaManager0.0': bunSchemaManager0.BunSchemaManager;
  '#CommandMiddleware0':
    | dicc0.DiccBusMiddleware
    | transaction0.TransactionMiddleware;
  '#CorsMiddleware0.0': cors0.CorsMiddleware;
  '#DefaultCommandBus0.0': defaultCommandBus0.DefaultCommandBus;
  '#DefaultCommandResolver0.0': defaultCommandResolver0.DefaultCommandResolver;
  '#DefaultConsoleOutput0.0': defaultConsoleOutput0.DefaultConsoleOutput;
  '#DefaultListCommandFactory0.0': defaultListCommand0.DefaultListCommandFactory;
  '#DiccBusMiddleware0.0': dicc0.DiccBusMiddleware;
  '#DiccHttpMiddleware0.0': dicc1.DiccHttpMiddleware;
  '#EnvironmentConfig0.0': ServiceType<typeof definitions0.createConfig>;
  '#ErrorsMiddleware0.0': errors0.ErrorsMiddleware;
  '#EventDispatcher0.0': eventDispatcher0.EventDispatcher;
  '#MigrateDbCommandFactory0.0': migrateDbCommand0.MigrateDbCommandFactory;
  '#MigrateDbHandlerFactory0.0': migrateDb0.MigrateDbHandlerFactory;
  '#RequestMiddleware0':
    | authenticator0.AuthenticatorMiddleware
    | cors0.CorsMiddleware
    | dicc1.DiccHttpMiddleware
    | errors0.ErrorsMiddleware;
  '#RunDaemonCommandFactory0.0': runDaemonCommand0.RunDaemonCommandFactory;
  '#TransactionMiddleware0.0': transaction0.TransactionMiddleware;
}

export class BugsContainer extends Container<PublicServices, DynamicServices, AnonymousServices> {
  constructor() {
    super({
      'application': {
        factory: (di) => new definitions0.application.factory(
          definitions0.application.args.name,
          definitions0.application.args.description,
          di.get('#DefaultCommandResolver0.0'),
          di.get('#DefaultConsoleOutput0.0'),
        ),
      },
      '#AnyEntitySchema0.0': {
        factory: undefined,
      },
      '#Authenticator0.0': {
        factory: undefined,
      },
      '#AuthenticatorMiddleware0.0': {
        aliases: ['#RequestMiddleware0'],
        factory: (di) => new authenticator0.AuthenticatorMiddleware(
          di.get('#EventDispatcher0.0'),
          di.find('#Authenticator0.0'),
          (service) => di.register('#Identity0.0', service),
        ),
      },
      '#BunEntityManager0.1': {
        factory: (di) => new definitions0.entityManager.factory(
          definitions0.entityManager.args.databaseFile(
            di.get('#EnvironmentConfig0.0'),
          ),
          di.find('#AnyEntitySchema0.0'),
        ),
        onFork: async (callback, service) => definitions0.entityManager.onFork(
          callback,
          service,
        ),
      },
      '#BunErrorHandler0.0': {
        factory: () => new bunErrorHandler0.BunErrorHandler(),
      },
      '#BunHttpServer0.1': {
        factory: (di) => new definitions0.httpServer.factory(
          di.find('#RequestMiddleware0'),
          di.find('#Route0.0'),
          di.get('#EventDispatcher0.0'),
          di.get('#BunErrorHandler0.0'),
          definitions0.httpServer.args.listenOn(
            di.get('#EnvironmentConfig0.0'),
          ),
        ),
      },
      '#BunSchemaManager0.0': {
        factory: (di) => new bunSchemaManager0.BunSchemaManager(
          di.get('#BunEntityManager0.1'),
          di.iterate('#Migration0.0'),
        ),
      },
      '#CorsMiddleware0.0': {
        aliases: ['#RequestMiddleware0'],
        factory: () => new cors0.CorsMiddleware(),
      },
      '#DefaultCommandBus0.0': {
        factory: (di) => new defaultCommandBus0.DefaultCommandBus(
          di.find('#MigrateDbHandlerFactory0.0'),
          di.find('#CommandMiddleware0'),
        ),
      },
      '#DefaultCommandResolver0.0': {
        factory: (di) => new defaultCommandResolver0.DefaultCommandResolver(
          di.find('#AnyCommandFactory0'),
        ),
      },
      '#DefaultConsoleOutput0.0': {
        factory: () => new defaultConsoleOutput0.DefaultConsoleOutput(),
      },
      '#DefaultListCommandFactory0.0': {
        aliases: ['#AnyCommandFactory0'],
        factory: (di) => new class extends defaultListCommand0.DefaultListCommandFactory {
          create: defaultListCommand0.DefaultListCommandFactory['create'] = async () => new defaultListCommand0.DefaultListCommand(
            () => di.get('application'),
            () => di.get('#DefaultCommandResolver0.0'),
            di.get('#DefaultConsoleOutput0.0'),
          );
        },
      },
      '#DiccBusMiddleware0.0': {
        aliases: ['#CommandMiddleware0'],
        factory: (di) => new dicc0.DiccBusMiddleware(
          { async run(cb) { return di.run(cb); } },
        ),
      },
      '#DiccHttpMiddleware0.0': {
        aliases: ['#RequestMiddleware0'],
        factory: (di) => new dicc1.DiccHttpMiddleware(
          { async run(cb) { return di.run(cb); } },
        ),
      },
      '#EnvironmentConfig0.0': {
        factory: () => definitions0.createConfig(),
      },
      '#ErrorsMiddleware0.0': {
        aliases: ['#RequestMiddleware0'],
        factory: () => new errors0.ErrorsMiddleware(),
      },
      '#EventDispatcher0.0': {
        factory: () => new eventDispatcher0.EventDispatcher(),
      },
      '#Identity0.0': {
        factory: undefined,
      },
      '#MigrateDbCommandFactory0.0': {
        aliases: ['#AnyCommandFactory0'],
        factory: (di) => new class extends migrateDbCommand0.MigrateDbCommandFactory {
          create: migrateDbCommand0.MigrateDbCommandFactory['create'] = () => new migrateDbCommand0.MigrateDbCommand(
            di.get('#DefaultCommandBus0.0'),
          );
        },
      },
      '#MigrateDbHandlerFactory0.0': {
        factory: (di) => new class extends migrateDb0.MigrateDbHandlerFactory {
          create: migrateDb0.MigrateDbHandlerFactory['create'] = async () => new migrateDb0.MigrateDbHandler(
            di.get('#BunSchemaManager0.0'),
          );
        },
      },
      '#Migration0.0': {
        factory: undefined,
      },
      '#Route0.0': {
        factory: undefined,
      },
      '#RunDaemonCommandFactory0.0': {
        aliases: ['#AnyCommandFactory0'],
        factory: (di) => new class extends runDaemonCommand0.RunDaemonCommandFactory {
          create: runDaemonCommand0.RunDaemonCommandFactory['create'] = async () => new runDaemonCommand0.RunDaemonCommand(
            di.get('#DefaultCommandBus0.0'),
            di.find('#BunHttpServer0.1'),
          );
        },
      },
      '#TransactionMiddleware0.0': {
        aliases: ['#CommandMiddleware0'],
        factory: (di) => new transaction0.TransactionMiddleware(
          di.get('#BunEntityManager0.1'),
        ),
      },
    });
  }
}
