import Discord from "discord.js";
import winston, { format } from "winston";
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
export function useLogger(
  level: LogLevel = defaultLevel,
  defaultMeta: unknown = undefined
): Logger {
  let logger = loggers.get(level);

  if (!logger) {
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
        //
        // TODO: Delete these files periodically
        new winston.transports.File({
          filename: "./logs/error.log",
          level: "error",
          format: format.combine(format.timestamp(), format.json())
        }),
        new winston.transports.File({
          filename: "./logs/combined.log",
          level,
          format: format.combine(format.timestamp(), format.json())
        }),
        new winston.transports.Console({
          // When using PM2, do `pm2 logs gamgee --timestamp`
          // format: format.combine(
          //   format.colorize(),
          //   format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
          //   format.printf(info => {
          //     const formattedDate = info["timestamp"] as string;
          //     return `${formattedDate}: ${info.level}: ${info.message}`;
          //   })
          // ),
          format: format.cli(),
          level
        })
      ]
    });

    loggers.set(level, logger);
  }

  return logger;
}
