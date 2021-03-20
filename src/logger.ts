import Discord from "discord.js";
import winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Discord.Collection<LogLevel, Logger>();
const defaultLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

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
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      logger.add(
        new winston.transports.Console({
          format: winston.format.cli()
        })
      );
    }

    loggers.set(level, logger);
  }

  return logger;
}
