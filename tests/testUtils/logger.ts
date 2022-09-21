import * as winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Map<LogLevel, Logger>();

/**
 * Sets up and returns the default test-time logger.
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useTestLogger(): Logger {
	const level: LogLevel = "error";
	let logger = loggers.get(level);

	if (!logger) {
		logger = winston.createLogger({
			level,
			format: winston.format.json(),
			defaultMeta: { service: "jest" },
			transports: [
				new winston.transports.Console({
					format: winston.format.cli()
				})
			]
		});

		loggers.set(level, logger);
	}

	return logger;
}
