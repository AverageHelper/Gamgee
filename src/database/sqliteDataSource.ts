import { PrismaClient } from "@prisma/client";
import { requireEnv } from "../helpers/environment.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

const dbFolder = new URL(requireEnv("DATABASE_URL"));
if (dbFolder.protocol !== "file:")
	throw new TypeError(`Expected a 'file:' URL for environment variable 'DATABASE_URL'.`);

const path = dbFolder.pathname;
logger.debug(`Database URL: '${path}'`);

export const dataSource = new PrismaClient();

// ** Graceful exit under PM2 **

function onShutdownFinished(): void {
	logger.info("SQLite is sleeping now.");
	logger.info("Goodnight!");
}

// See https://pm2.io/docs/runtime/best-practices/graceful-shutdown/
process.on("message", msg => {
	if (msg === "shutdown") {
		// PM2 sends a "shutdown" message on Windows
		logger.debug("Got a 'shutdown' message");

		/** Gracefully exit */
		/* eslint-disable promise/prefer-await-to-then */
		void dataSource
			.$disconnect()
			.then(onShutdownFinished)
			.catch((error: unknown) => {
				logger.error(richErrorMessage("Failed to shut down database connection.", error));
			});
		/* eslint-enable promise/prefer-await-to-then */
	}
});

// PM2 sends a SIGINT on Unix. We have 1600 ms to clean up and quit.
// Prisma's beforeExit event fires after a `SIGINT` signal, but before database shutdown.
dataSource.$on("beforeExit", onShutdownFinished);
