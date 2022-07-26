import { DatabaseLogger } from "./DatabaseLogger.js";
import { DataSource } from "typeorm";
import { DEFAULT_DATABASE_FOLDER } from "../constants/database.js";
import { getEnv } from "../helpers/environment.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { useLogger } from "../logger.js";
import * as entities from "./model/index.js";
import * as migrations from "./migrations/index.js";
import * as path from "node:path"; // We can't use default import because TypeORM's CLI doesn't expect it.

const logger = useLogger();

const dbFolder = path.normalize(getEnv("DATABASE_FOLDER") ?? DEFAULT_DATABASE_FOLDER);

const dbFile = path.join(dbFolder, "db.sqlite");

export const dataSource = new DataSource({
	type: "sqlite", // TODO: Wanna use MongoDB (probs via mongoose or smth)
	database: dbFile,
	logging: "all",
	logger: new DatabaseLogger(logger),
	entities: Object.values(entities),
	migrations: Object.values(migrations),
	synchronize: true // assumes migration was run before we get here
});

let isInitialized = false;

/**
 * Initializes the database connection, and sets up process listeners
 * to gracefully close the connection on exit.
 */
export async function initialize(): Promise<void> {
	// Make sure we don't initialize twice
	if (isInitialized) return;
	isInitialized = true;

	// We can't use top-level await because TypeORM's CLI doesn't expect it.
	await dataSource.initialize();

	/** Gracefully exit */
	function shutdownDatabaseThenExit(): void {
		logger.info("Shutting down SQLite...");
		// Node's `process` listeners don't do async/await
		void dataSource
			.destroy()
			// eslint-disable-next-line promise/prefer-await-to-then
			.then(() => {
				logger.info("SQLite is sleeping now.");
				logger.info("Goodnight!");
				process.exit(0);
			})
			// eslint-disable-next-line promise/prefer-await-to-then
			.catch((error: unknown) => {
				logger.error(richErrorMessage("Failed to stop SQLite data source.", error));
			});
	}

	// Graceful exit under PM2
	// See https://pm2.io/docs/runtime/best-practices/graceful-shutdown/
	process.on("message", msg => {
		if (msg === "shutdown") {
			// PM2 sends a "shutdown" message on Windows
			logger.debug("Got a 'shutdown' message from PM2");
			shutdownDatabaseThenExit();
		}
	});

	process.on("SIGINT", () => {
		// PM2 sends a SIGINT on Unix. We have 1600 ms to clean up and quit
		logger.debug("Got a 'SIGINT' signal from PM2");
		shutdownDatabaseThenExit();
	});
}
