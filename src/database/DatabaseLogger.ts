import type { Logger as GamgeeLogger } from "../logger";
import type { Logger as TypeORMLogger } from "typeorm";

export class DatabaseLogger implements TypeORMLogger {
  private readonly logger: GamgeeLogger;

  constructor(logger: GamgeeLogger) {
    this.logger = logger;
  }

  logQuery(query: string, parameters?: Array<unknown>): DatabaseLogger {
    this.logger.silly(JSON.stringify({ query, parameters }, undefined, 2));
    return this;
  }

  logQueryError(error: string | Error, query: string, parameters?: Array<unknown>): DatabaseLogger {
    this.logger.error(JSON.stringify({ error, query, parameters }, undefined, 2));
    return this;
  }

  logQuerySlow(time: number, query: string, parameters?: Array<unknown>): DatabaseLogger {
    this.logger.info(JSON.stringify({ time, query, parameters }, undefined, 2));
    return this;
  }

  logSchemaBuild(message: string): DatabaseLogger {
    this.logger.info(message);
    return this;
  }

  logMigration(message: string): DatabaseLogger {
    this.logger.info(message);
    return this;
  }

  log(level: "log" | "info" | "warn", message: unknown): DatabaseLogger {
    const l = level === "log" ? "info" : level;
    this.logger.log(l, JSON.stringify(message, undefined, 2));
    return this;
  }
}
