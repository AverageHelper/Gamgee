import Discord from "discord.js";
import winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Discord.Collection<LogLevel, Logger>();

/**
 * Sets up and returns the default test-time logger.
 *
 * @param level The lowest log level which should be printed to the console.
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useTestLogger(level: LogLevel = "warn"): Logger {
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
