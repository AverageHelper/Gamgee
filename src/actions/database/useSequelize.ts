import path from "path";
import { DEFAULT_DATABASE_FOLDER } from "../../constants/database";
import { Sequelize } from "sequelize";
import { useLogger } from "../../logger";

const logger = useLogger();

let sequelize: Sequelize | null = null;

export function useSequelize(): Sequelize {
  if (!sequelize) {
    const dbFolder = path.normalize(process.env.DATABASE_FOLDER ?? DEFAULT_DATABASE_FOLDER);
    const dbFile = path.join(dbFolder, "db.sqlite");
    logger.info(`Initializing database at path '${dbFile}'`);

    sequelize = new Sequelize("queues", "Gamgee", "strawberries", {
      host: "localhost",
      dialect: "sqlite",
      logging: sql => logger.silly(`Query: '${sql}'`),
      storage: dbFile
    });
    logger.debug("Initialized Sequelize client");
  }

  return sequelize;
}
