import Discord from "discord.js";
import winston from "winston";
import { getEnv } from "./helpers/environment";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Discord.Collection<LogLevel, Logger>();
const defaultLevel: LogLevel = getEnv("NODE_ENV") === "production" ? "info" : "debug";

/**
 * Sets up and returns the default runtime logger.
 *
 * @param level The lowest log level which should be printed to the console.
 *
 * @returns The logger, or a new one if no logger has been set up yet.
 */
export function useLogger(level: LogLevel = defaultLevel, defaultMeta?: unknown): Logger {
  let logger = loggers.get(level);

  if (!logger) {
    logger = winston.createLogger({
      level,
      format: winston.format.json(),
      defaultMeta,
      // defaultMeta: { service: "user-service" },
      transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        // TODO: Delete these periodically
        new winston.transports.File({ filename: "./logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "./logs/combined.log", level: "info" })
      ]
    });

    //
    // If we're not in production or test then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    logger.add(
      new winston.transports.Console({
        format: winston.format.cli(),
        level: getEnv("NODE_ENV") === "test" ? "error" : level
      })
    );

    loggers.set(level, logger);
  }

  return logger;
}
