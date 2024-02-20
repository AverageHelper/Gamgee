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

async function shutDownNow(): Promise<void> {
	try {
		await dataSource.$disconnect();
		logger.info("SQLite is sleeping now.");
	} catch (error) {
		logger.error(richErrorMessage("Failed to shut down database connection.", error));
	} finally {
		logger.info("Goodnight!");
	}
}

// See https://pm2.io/docs/runtime/best-practices/graceful-shutdown/
process.on("message", msg => {
	if (msg === "shutdown") {
		// PM2 sends a "shutdown" message on Windows
		logger.debug("Got a 'shutdown' message");

		/** Gracefully exit */
		void shutDownNow();
	}
});

function reallyShutdownNow(): void {
	// This force-exit backflip is needed because, for some reason, we run with two Node processes, and the second one doesn't close when the main one does. Doing `process.exit` seems to close both properly.
	void shutDownNow()
		/* eslint-disable promise/prefer-await-to-then */
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
	/* eslint-enable promise/prefer-await-to-then */
}

// PM2 sends a SIGINT on Unix. We have 1600 ms to clean up and quit.
process.on("exit", reallyShutdownNow);
process.on("beforeExit", reallyShutdownNow);
process.on("SIGINT", reallyShutdownNow);
process.on("SIGTERM", reallyShutdownNow);
process.on("SIGUSR2", reallyShutdownNow);
