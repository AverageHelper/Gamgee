import path from "path";
import { DEFAULT_DATABASE_FOLDER } from "../../constants/database";
import { Sequelize } from "sequelize";
import { queueEntrySchema, queueConfigSchema, channelSchema, guildSchema } from "./schemas";
import { useLogger } from "../../logger";

const logger = useLogger();

/**
 * An interface for reading from and writing to the database
 */
interface Database {
  /** The database proxy instance. */
  sequelize: Sequelize;

  // Tables
  Guilds: ReturnType<typeof guildSchema>;
  Channels: ReturnType<typeof channelSchema>;
  QueueConfigs: ReturnType<typeof queueConfigSchema>;
  QueueEntries: ReturnType<typeof queueEntrySchema>;
}

const dbFolder = path.normalize(process.env.DATABASE_FOLDER ?? DEFAULT_DATABASE_FOLDER);
const dbFile = path.join(dbFolder, "db.sqlite");
logger.info(`Initializing database at path '${dbFile}'`);

const sequelize = new Sequelize("queues", "Gamgee", "strawberries", {
  host: "localhost",
  dialect: "sqlite",
  logging: sql => logger.silly(`Query: '${sql}'`),
  storage: dbFile
});
logger.debug("Initializing Sequelize client...");

let isDbSetUp = false;

const Guilds = guildSchema(sequelize);
const Channels = channelSchema(sequelize);
const QueueConfigs = queueConfigSchema(sequelize);
const QueueEntries = queueEntrySchema(sequelize);

/**
 * Sets up the database to receive data from our schema's tables.
 * If these tables already exist in the database, nothing more is done.
 *
 * @returns This action only occurs once per run.
 */
async function syncSchemas(): Promise<void> {
  if (isDbSetUp) return;

  logger.debug("Syncing schemas with the database...");
  await Guilds.sync();
  await Channels.sync();
  await QueueConfigs.sync();
  await QueueEntries.sync();
  logger.debug("Schemas synced!");
  isDbSetUp = true;
}

/**
 * Prepares a SQLite database with tables
 *
 * @returns The prepared database proxy and schema definitions.
 */
export async function useDatabase(): Promise<Database> {
  await syncSchemas();

  return {
    sequelize,
    Guilds,
    Channels,
    QueueConfigs,
    QueueEntries
  };
}
