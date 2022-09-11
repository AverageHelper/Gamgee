import { getEnv } from "./helpers/environment.js";
import DailyRotateFile from "winston-daily-rotate-file";
import winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

// TODO: Separate logger for each guild. Guild-specific logs should go into a subfolder, with the usual rotate configs within. System-level logs should be treated no differently from before. (Maybe use `defaultMeta` instead?)
const loggers = new Map<LogLevel, Logger>();
const format = winston.format;

// TODO: Get logger display level from environment vars. Default to "verbose"
const nodeEnv = getEnv("NODE_ENV");
const defaultLevel: LogLevel =
	nodeEnv === "production" ? "info" : nodeEnv === "test" ? "error" : "debug";

/**
 * Sets up and returns the default runtime logger.
 *
 * @param level The lowest log level which should be printed to the console.
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useLogger(
	level: LogLevel = defaultLevel,
	defaultMeta: unknown = undefined
): Logger {
	let logger = loggers.get(level);

	if (!logger) {
		const logFileFormat = format.combine(format.timestamp(), format.json());

		const errorFileTransport = new DailyRotateFile({
			filename: "./logs/error-%DATE%.log", // TODO: Support a user-defined `logs` directory
			level: "error",
			format: logFileFormat,
			datePattern: "YYYY-MM-DD-HH",
			utc: true,
			frequency: "24h", // rotate daily
			maxFiles: "30d", // retain 30 days only
			zippedArchive: true
		});

		const combinedFileTransport = new DailyRotateFile({
			filename: "./logs/combined-%DATE%.log",
			level,
			format: logFileFormat,
			datePattern: "YYYY-MM-DD-HH",
			utc: true,
			frequency: "24h", // rotate daily
			maxFiles: "30d", // retain 30 days only
			zippedArchive: true
		});

		logger = winston.createLogger({
			level,
			format: format.json(),
			defaultMeta,
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

		for (const xport of [errorFileTransport, combinedFileTransport]) {
			xport.on("new", (newFilename: string) => {
				logger?.info(`NEW LOG CREATED AT '${newFilename}'`);
			});
			xport.on("rotate", (oldFilename: string, newFilename: string) => {
				logger?.info(`LOGS ROTATED FROM '${oldFilename}' TO '${newFilename}'`);
			});
			xport.on("archive", (zipFilename: string) => {
				logger?.info(`ARCHIVED OLD LOG TO '${zipFilename}'`);
			});
			xport.on("logRemoved", (removedFilename: string) => {
				logger?.info(`DELETED OLD LOG '${removedFilename}'`);
			});
		}

		// TODO: Discord Developer ToS mandates that API data be encrypted at rest (§5c). Should that be up to us, or to the host's full-disk-encryption?

		// eslint-disable-next-line no-constant-condition
		if (true || nodeEnv !== "test") {
			logger.add(
				new winston.transports.Console({
					format: format.cli(),
					level
				})
			);
		}

		loggers.set(level, logger);
	}

	return logger;
}
