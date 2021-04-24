import path from "path";
import { DEFAULT_DATABASE_FOLDER } from "../constants/database";
import { v4 as uuid } from "uuid";
import { getEnv } from "../helpers/environment";
import { createConnection } from "typeorm";
import { useLogger } from "../logger";
import { DatabaseLogger } from "./DatabaseLogger";
import type { EntityTarget, EntityManager, Repository, Connection } from "typeorm";
import * as entities from "./model";
import * as migrations from "./migrations";

const logger = useLogger();

export async function useDatabaseConnection<T = undefined>(
  cb: (connection: Connection) => T | Promise<T>
): Promise<T> {
  const dbFolder = path.normalize(getEnv("DATABASE_FOLDER") ?? DEFAULT_DATABASE_FOLDER);
  const dbFile = path.join(dbFolder, "db.sqlite");

  const connId = uuid();
  logger.silly(
    `Opening a new connection to database at path '${dbFile}'; Connection ID: ${connId}`
  );

  const connection = await createConnection({
    name: connId,
    type: "sqlite",
    database: dbFile,
    logging: "all",
    logger: new DatabaseLogger(logger),
    busyErrorRetry: 100,
    entities: Object.values(entities),
    migrations: Object.values(migrations),
    synchronize: true
  });

  const result = await cb(connection);

  logger.silly(`Closing connection ${connId}`);
  await connection.close();

  return result;
}

export async function useRepository<Entity, T = undefined>(
  target: EntityTarget<Entity>,
  cb: (repository: Repository<Entity>) => T | Promise<T>
): Promise<T> {
  return useDatabaseConnection(connection => {
    return cb(connection.getRepository(target));
  });
}

export async function useTransaction<T = undefined>(
  cb: (entityManager: EntityManager) => T | Promise<T>
): Promise<T> {
  return useDatabaseConnection(async connection => {
    return connection.transaction(async transaction => {
      return cb(transaction);
    });
  });
}
