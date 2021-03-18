import Discord from "discord.js";
import AsyncLock from "async-lock";
import { Sequelize, UniqueConstraintError } from "sequelize";
import { queueEntrySchema, channelSchema, guildSchema } from "./constants/queues/schemas";
import type { QueueEntrySchema } from "./constants/queues/schemas/queueEntrySchema";
import { useLogger } from "./logger";

const lock = new AsyncLock();
const logger = useLogger();

let isDbSetUp = false;

const sequelize = new Sequelize("queues", "Gamgee", "strawberries", {
  host: "localhost",
  dialect: "sqlite",
  logging: sql => logger.silly(`Query: '${sql}'`),
  storage: "./config/queues/queues-db.sqlite"
});
logger.debug("Initializing Sequelize client...");

export interface QueueEntry {
  queueMessageId: string;
  url: string;
  minutes: number;
  sentAt: Date;
  senderId: string;
}
export type UnsentQueueEntry = Omit<QueueEntry, "queueMessageId">;

/**
 * Converts a `QueueEntrySchema` instance to a `QueueEntry`.
 * @param storedEntry Queue entry data from the database.
 * @returns A `QueueEntry` object.
 */
function toQueueEntry(storedEntry: QueueEntrySchema): QueueEntry {
  return {
    queueMessageId: storedEntry.queueMessageId,
    url: storedEntry.url,
    minutes: storedEntry.minutes,
    sentAt: storedEntry.sentAt,
    senderId: storedEntry.senderId
  };
}

const Guilds = guildSchema(sequelize);
const Channels = channelSchema(sequelize);
const QueueEntries = queueEntrySchema(sequelize);

function syncSchemas(): Promise<void> {
  return lock.acquire("sequelize", async done => {
    if (isDbSetUp) return done();

    await Guilds.sync();
    await Channels.sync();
    await QueueEntries.sync();
    isDbSetUp = true;

    done();
  });
}

export class DuplicateEntryTimeError extends Error {
  readonly entry: QueueEntry;

  constructor(entry: QueueEntry) {
    super("Duplicate entry. Try again.");
    this.entry = entry;
  }
}

interface QueueEntryManager {
  /** The channel for this queue. */
  queueChannel: Discord.Channel;

  /** Adds the queue entry to the database. */
  create: (entry: QueueEntry) => Promise<QueueEntry>;

  /** Removes the queue entry from the database. */
  remove: (entry: QueueEntry) => Promise<void>;

  /** Fetches all entries in queue order. */
  fetchAll: () => Promise<Array<QueueEntry>>;

  /** Fetches the number of entries in the queue. */
  countAll: () => Promise<number>;

  /** Fetches all entries by the given user in order of submission. */
  fetchAllFrom: (senderId: string) => Promise<Array<QueueEntry>>;

  /** Fetches the number of entries from the given user in the queue. */
  countAllFrom: (senderId: string) => Promise<number>;

  /** Delete all entries for this queue channel. */
  clear: () => Promise<void>;
}

export async function useQueueStorage(
  queueChannel: Discord.TextChannel
): Promise<QueueEntryManager> {
  logger.debug("Syncing schemas with the database...");
  await syncSchemas();
  logger.debug("Schemas synced!");

  return {
    queueChannel,
    async create(entry) {
      // Make sure the guild and channels are in there
      await Guilds.upsert({
        id: queueChannel.guild.id
      });
      await Channels.upsert({
        id: queueChannel.id,
        guildId: queueChannel.guild.id
      });

      try {
        await QueueEntries.create({
          queueMessageId: entry.queueMessageId,
          url: entry.url,
          minutes: entry.minutes,
          guildId: queueChannel.guild.id,
          channelId: queueChannel.id,
          senderId: entry.senderId,
          sentAt: entry.sentAt
        });
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          // Wait half a second, set the date to now, then try again.
          logger.error(error);
          throw new DuplicateEntryTimeError(entry);
        }
        throw error;
      }

      return entry;
    },
    async remove(entry) {
      await QueueEntries.destroy({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          queueMessageId: entry.queueMessageId
        }
      });
    },
    async fetchAll() {
      const entries = await QueueEntries.findAll({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        }
      });
      return entries.map(toQueueEntry);
    },
    countAll() {
      return QueueEntries.count({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        }
      });
    },
    async fetchAllFrom(senderId) {
      const entries = await QueueEntries.findAll({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          senderId
        }
      });
      return entries.map(toQueueEntry);
    },
    countAllFrom(senderId) {
      return QueueEntries.count({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          senderId
        }
      });
    },
    async clear() {
      await QueueEntries.destroy({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        }
      });
    }
  };
}
