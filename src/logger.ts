import type { DailyRotateFileTransportOptions } from "winston-daily-rotate-file";
import type { Logger } from "winston";
import { createLogger, format, transports } from "winston";
import { getEnv } from "./helpers/environment.js";
import DailyRotateFile from "winston-daily-rotate-file";

const logLevels = ["silly", "debug", "verbose", "info", "warn", "error"] as const;
export type LogLevel = typeof logLevels[number];
export type { Logger };

function isLogLevel(tbd: unknown): tbd is LogLevel {
	return logLevels.includes(tbd as LogLevel);
}

// TODO: Separate logger for each guild. Guild-specific logs should go into a subfolder, with the usual rotate configs within. System-level logs should be treated no differently from before. (Maybe use `defaultMeta` instead?)
const loggers = new Map<LogLevel, Logger>();

// Let the admin decide what level to log to console, or default to a case tree based on NODE_ENV
const rawLogLevel = getEnv("LOG_LEVEL");
const consoleLogLevel = isLogLevel(rawLogLevel) ? rawLogLevel : null;

const nodeEnv = getEnv("NODE_ENV") ?? "";
const defaultConsoleLogLevel: LogLevel =
	consoleLogLevel ??
	(nodeEnv === "production" //
		? "info"
		: nodeEnv.startsWith("test")
		? "error"
		: "debug");

const logFileFormat = format.combine(format.timestamp(), format.json());
const dirname = "./logs"; // TODO: Support a user-defined `logs` directory
const fileTransportOptions: DailyRotateFileTransportOptions = {
	filename: "%DATE%",
	dirname,
	extension: ".log",
	format: logFileFormat,
	datePattern: "YYYY-MM-DD-HH",
	utc: true,
	frequency: "24h", // rotate daily
	maxFiles: "30d", // retain 30 days only
	zippedArchive: true
};

const errorFileTransport = new DailyRotateFile({
	...fileTransportOptions,
	level: "error",
	filename: "error-%DATE%"
});

const combinedFileTransport = new DailyRotateFile({
	...fileTransportOptions,
	level: "silly",
	filename: "combined-%DATE%"
});

let hasSetTransportNotices = false;

/**
 * Sets up and returns the default runtime logger.
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useLogger(): Logger {
	const consoleLogLevel: LogLevel = defaultConsoleLogLevel;
	let logger = loggers.get(consoleLogLevel);

	if (!logger) {
		logger = createLogger({
			level: "silly",
			format: format.combine(format.timestamp(), format.json()),
			// defaultMeta: { service: "user-service" },
			transports: [
				//
				// - Write all logs with level `error` and below to `error.log`
				// - Write all logs with level `info` and below to `combined.log`
				// - Write important runtime logs to console
				// - Rotate files daily, and retain only the last 30 days of logs
				//
				errorFileTransport,
				combinedFileTransport
			]
		});

		// eslint-disable-next-line no-constant-condition
		if (true || nodeEnv !== "test") {
			logger.add(
				new transports.Console({
					format: format.cli(),
					level: consoleLogLevel
				})
			);
		}

		logger.info(`LOGGER STARTED FOR CONSOLE LEVEL '${consoleLogLevel}'`);

		if (!hasSetTransportNotices) {
			// Notify the logger that logs were set, but only register these notifications once
			hasSetTransportNotices = true;

			for (const xport of [errorFileTransport, combinedFileTransport]) {
				const level = xport.level !== undefined ? `'${xport.level}'` : "";

				xport.on("new", (newFilename: string) => {
					logger?.info(`NEW ${level} LOG CREATED AT '${newFilename}'`);
				});
				xport.on("rotate", (oldFilename: string, newFilename: string) => {
					logger?.info(`${level} LOGS ROTATED FROM '${oldFilename}' TO '${newFilename}'`);
				});
				xport.on("archive", (zipFilename: string) => {
					logger?.info(`ARCHIVED OLD ${level} LOG TO '${zipFilename}'`);
				});
				xport.on("logRemoved", (removedFilename: string) => {
					logger?.info(`DELETED OLD ${level} LOG '${removedFilename}'`);
				});
			}
		}

		// TODO: Discord Developer ToS mandates that API data be encrypted at rest (§5c). Should that be up to us, or to the host's full-disk-encryption?

		loggers.set(consoleLogLevel, logger);
	}

	return logger;
}
