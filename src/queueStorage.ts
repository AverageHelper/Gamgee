import Discord from "discord.js";
import AsyncLock from "async-lock";
import { Sequelize, UniqueConstraintError } from "sequelize";
import {
  queueEntrySchema,
  queueConfigSchema,
  channelSchema,
  guildSchema
} from "./constants/queues/schemas";
import type { QueueConfig } from "./constants/queues/schemas/queueConfigSchema";
import type { QueueEntrySchema } from "./constants/queues/schemas/queueEntrySchema";
import { DEFAULT_ENTRY_DURATION, DEFAULT_SUBMISSION_COOLDOWN } from "./constants/queues/configs";
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
  seconds: number;
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
    seconds: storedEntry.seconds,
    sentAt: storedEntry.sentAt,
    senderId: storedEntry.senderId
  };
}

// TODO: Add locks around any Sequelize access

const Guilds = guildSchema(sequelize);
const Channels = channelSchema(sequelize);
const QueueConfigs = queueConfigSchema(sequelize);
const QueueEntries = queueEntrySchema(sequelize);

function syncSchemas(): Promise<void> {
  return lock.acquire("sequelize", async done => {
    if (isDbSetUp) return done();

    try {
      await Guilds.sync();
      await Channels.sync();
      await QueueConfigs.sync();
      await QueueEntries.sync();
      isDbSetUp = true;
      done();
    } catch (error) {
      done(error);
    }
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

  /** Retrieves the queue's configuration settings. */
  getConfig: () => Promise<QueueConfig>;

  /** Updates the provided properties of a queue's configuration settings. */
  updateConfig: (config: Partial<QueueConfig>) => Promise<void>;

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

  async function getConfig(): Promise<QueueConfig> {
    return lock.acquire("sequelize", done => {
      void QueueConfigs.findOne({
        where: {
          channelId: queueChannel.id
        }
      })
        .then(config =>
          done(undefined, {
            entryDurationSeconds: config?.entryDurationSeconds ?? DEFAULT_ENTRY_DURATION,
            cooldownSeconds: config?.cooldownSeconds ?? DEFAULT_SUBMISSION_COOLDOWN
          })
        )
        .catch(error => done(error));
    });
  }

  return {
    queueChannel,
    getConfig,
    async updateConfig(config) {
      const oldConfig = await getConfig();
      let entryDurationSeconds: number | null;
      if (config.entryDurationSeconds === undefined) {
        entryDurationSeconds = oldConfig.entryDurationSeconds;
      } else {
        entryDurationSeconds = config.entryDurationSeconds;
      }
      let cooldownSeconds: number | null;
      if (config.cooldownSeconds === undefined) {
        cooldownSeconds = oldConfig.cooldownSeconds;
      } else {
        cooldownSeconds = config.cooldownSeconds;
      }
      await QueueConfigs.upsert({
        channelId: queueChannel.id,
        entryDurationSeconds,
        cooldownSeconds
      });
    },
    async create(entry) {
      try {
        // Make sure the guild and channels are in there
        await Guilds.upsert({
          id: queueChannel.guild.id
        });
        await Channels.upsert({
          id: queueChannel.id,
          guildId: queueChannel.guild.id
        });

        // Make sure we have at least the default config
        await QueueConfigs.findOrCreate({
          where: {
            channelId: queueChannel.id
          },
          defaults: {
            channelId: queueChannel.id,
            entryDurationSeconds: DEFAULT_ENTRY_DURATION,
            cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN
          }
        });

        // Add the entry
        await QueueEntries.create({
          queueMessageId: entry.queueMessageId,
          url: entry.url,
          seconds: entry.seconds,
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
