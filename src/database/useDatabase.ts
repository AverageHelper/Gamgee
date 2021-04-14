import path from "path";
import { DEFAULT_DATABASE_FOLDER } from "../constants/database";
import { v4 as uuid } from "uuid";
import { getEnv } from "../helpers/environment";
import { createConnection } from "typeorm";
import { useLogger } from "../logger";
import { DatabaseLogger } from "./DatabaseLogger";
import type { Logger as GamgeeLogger } from "../logger";
import type { EntityTarget, EntityManager, Repository, Connection } from "typeorm";
import * as entities from "./model";

const logger = useLogger();

export async function useDatabaseConnection<T = undefined>(
  cb: (connection: Connection) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  const dbFolder = path.normalize(getEnv("DATABASE_FOLDER") ?? DEFAULT_DATABASE_FOLDER);
  const dbFile = path.join(dbFolder, "db.sqlite");

  const connId = uuid();
  gLogger.silly(
    `Opening a new connection to database at path '${dbFile}'; Connection ID: ${connId}`
  );

  const connection = await createConnection({
    name: connId,
    type: "sqlite",
    database: dbFile,
    synchronize: true,
    logging: "all",
    logger: new DatabaseLogger(gLogger),
    busyErrorRetry: 100,
    entities: Object.values(entities)
  });

  const result = await cb(connection);

  gLogger.silly(`Closing connection ${connId}`);
  await connection.close();

  return result;
}

export async function useRepository<Entity, T = undefined>(
  target: EntityTarget<Entity>,
  cb: (repository: Repository<Entity>) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  return useDatabaseConnection(connection => {
    return cb(connection.getRepository(target));
  }, gLogger);
}

export async function useTransaction<T = undefined>(
  cb: (entityManager: EntityManager) => T | Promise<T>,
  gLogger: GamgeeLogger = logger
): Promise<T> {
  return useDatabaseConnection(async connection => {
    return connection.transaction(async transaction => {
      return cb(transaction);
    });
  }, gLogger);
}
