import Discord from "discord.js";
import winston from "winston";

export type Logger = winston.Logger;
export type LogLevel = "silly" | "debug" | "verbose" | "info" | "warn" | "error";

const loggers = new Discord.Collection<LogLevel, Logger>();

export function useLogger(level: LogLevel = "debug"): Logger {
  let logger = loggers.get(level);

  if (!logger) {
    logger = winston.createLogger({
      level,
      format: winston.format.json(),
      // defaultMeta: { service: "user-service" },
      transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log", level: "info" })
      ]
    });

    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
    if (process.env.NODE_ENV !== "production") {
      logger.add(
        new winston.transports.Console({
          format: winston.format.cli({
            // colors: { error: "red", warn: "yellow", info: "cyan", debug: "green" }
          })
        })
      );
    }

    loggers.set(level, logger);
  }

  return logger;
}