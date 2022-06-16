import type { EntityTarget, EntityManager, Repository, Connection } from "typeorm";
import { createConnection } from "typeorm";
import { DatabaseLogger } from "./DatabaseLogger.js";
import { DEFAULT_DATABASE_FOLDER } from "../constants/database.js";
import { getEnv } from "../helpers/environment.js";
import { useLogger } from "../logger.js";
import { v4 as uuid } from "uuid";
import * as entities from "./model/index.js";
import * as migrations from "./migrations/index.js";
import path from "path";

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

	// TODO: I'd rather use MongoDB (probs via mongoose or smth)

	const connection = await createConnection({
		name: connId,
		type: "sqlite",
		database: dbFile,
		logging: "all",
		logger: new DatabaseLogger(logger),
		entities: Object.values(entities),
		migrations: Object.values(migrations),
		synchronize: true // assumes migration was run before we get here
	});

	const result = await cb(connection);

	logger.silly(`Closing connection ${connId}`);
	await connection.close();

	return result;
}

export async function useRepository<Entity, T = undefined>(
	targetOrRepository: EntityTarget<Entity> | Repository<Entity>,
	cb: (repository: Repository<Entity>) => T | Promise<T>
): Promise<T> {
	// eslint-disable-next-line @typescript-eslint/no-base-to-string
	// logger.debug(`Using DB repository: ${targetOrRepository.toString()}`);
	return await useDatabaseConnection(async connection => {
		if (typeof targetOrRepository !== "string" && "manager" in targetOrRepository) {
			return await cb(targetOrRepository);
		}
		return await cb(connection.getRepository(targetOrRepository));
	});
}

export async function useTransaction<T = undefined>(
	cb: (entityManager: EntityManager) => T | Promise<T>
): Promise<T> {
	// logger.debug(`Using DB transaction`);
	return await useDatabaseConnection(async connection => {
		return await connection.transaction(async transaction => {
			return await cb(transaction);
		});
	});
}
