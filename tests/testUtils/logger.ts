import * as winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Map<LogLevel | "none", Logger>();

/**
 * Sets up and returns the default test-time logger.
 *
 * @param level The minimum level of log messages that should be logged to the console.
 * If omitted, then all logs are sent to `/dev/null` (ignored).
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useTestLogger(level?: LogLevel): Logger {
	let logger = loggers.get(level ?? "none");

	if (!logger) {
		logger = winston.createLogger({
			level: level ?? "error",
			format: winston.format.json(),
			defaultMeta: { service: "vitest" },
			transports: [
				level
					? // Log to console
						new winston.transports.Console({
							format: winston.format.cli()
						})
					: // Ignore all log messages
						new winston.transports.File({
							filename: "/dev/null"
						})
			]
		});

		loggers.set(level ?? "none", logger);
	}

	return logger;
}
