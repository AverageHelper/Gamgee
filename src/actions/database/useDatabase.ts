import type { Sequelize } from "sequelize";
import { queueEntrySchema, queueConfigSchema, channelSchema, guildSchema } from "./schemas";
import { useSequelize } from "./useSequelize";

/**
 * An interface for reading from and writing to the database
 */
export interface Database {
  /** The database proxy instance. */
  proxy: Sequelize;

  // Tables
  Guilds: ReturnType<typeof guildSchema>;
  Channels: ReturnType<typeof channelSchema>;
  QueueConfigs: ReturnType<typeof queueConfigSchema>;
  QueueEntries: ReturnType<typeof queueEntrySchema>;
}

const sequelize = useSequelize();
const Guilds = guildSchema();
const Channels = channelSchema();
const QueueConfigs = queueConfigSchema();
const QueueEntries = queueEntrySchema();

/**
 * Sets up the database to receive data from our schema's tables.
 * If these tables already exist in the database, nothing more is done.
 */
async function syncSchemas(): Promise<void> {
  await Guilds.sync();
  await Channels.sync();
  await QueueConfigs.sync();
  await QueueEntries.sync();
}

/**
 * Prepares a SQLite database interface.
 *
 * @returns The prepared database proxy and schema definitions.
 */
export async function useDatabase(): Promise<Database> {
  await syncSchemas();

  return {
    proxy: sequelize,
    Guilds,
    Channels,
    QueueConfigs,
    QueueEntries
  };
}
