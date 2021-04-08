import path from "path";
import { DEFAULT_DATABASE_FOLDER } from "../constants/database";
import { getEnv } from "../helpers/environment";
import { createConnection } from "typeorm";
import { v4 as uuid } from "uuid";
import type { EntityManager, Connection, Logger as TypeORMLogger } from "typeorm";
import type { Logger as GamgeeLogger } from "../logger";
import { useLogger } from "../logger";
import * as entities from "./model";

const logger = useLogger();

function toLogger(logger: GamgeeLogger | null): TypeORMLogger | undefined {
  if (logger === null) return undefined;

  return {
    logQuery(query, parameters?: Array<unknown>): GamgeeLogger {
      return logger.silly(JSON.stringify({ query, parameters }, undefined, 2));
    },
    logQueryError(error, query: string, parameters?: Array<unknown>): GamgeeLogger {
      return logger.error(JSON.stringify({ error, query, parameters }, undefined, 2));
    },
    logQuerySlow(time, query, parameters?: Array<unknown>): GamgeeLogger {
      return logger.info(JSON.stringify({ time, query, parameters }, undefined, 2));
    },
    logSchemaBuild(message): GamgeeLogger {
      return logger.info(message);
    },
    logMigration(message): GamgeeLogger {
      return logger.info(message);
    },
    log(level, message: unknown): GamgeeLogger {
      const l = level === "log" ? "info" : level;
      return logger.log(l, JSON.stringify(message, undefined, 2));
    }
  };
}

export async function useDatabaseConnection<T = undefined>(
  cb: (connection: Connection) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  const dbFolder = path.normalize(getEnv("DATABASE_FOLDER") ?? DEFAULT_DATABASE_FOLDER);
  const dbFile = path.join(dbFolder, "db.sqlite");
  gLogger?.info(`Opening a connection to database at path '${dbFile}'`);

  const connection = await createConnection({
    name: uuid(),
    type: "sqlite",
    database: dbFile, // "queues",
    // host: "localhost",
    // port: 3306,
    // username: "Gamgee",
    // password: "strawberries",
    synchronize: true,
    logging: "all",
    logger: toLogger(gLogger),
    busyErrorRetry: 100,
    entities: Object.values(entities)
  });

  const result = await cb(connection);

  gLogger?.info(`Closing connection to database at path '${dbFile}'`);
  void connection.close();

  return result;
}

export async function useDatabase<T = undefined>(
  cb: (entityManager: EntityManager) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  return useDatabaseConnection(connection => cb(connection.manager), gLogger);
}

export async function useDatabaseTransaction<T = undefined>(
  cb: (entityManager: EntityManager) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  return useDatabaseConnection(async connection => {
    return connection.transaction(async transaction => {
      return cb(transaction);
    });
  }, gLogger);
}
