import Discord from "discord.js";
import { UniqueConstraintError, Transaction } from "sequelize";
import type { QueueConfig } from "./actions/database/schemas/queueConfigSchema";
import type { QueueEntrySchema } from "./actions/database/schemas/queueEntrySchema";
import { useDatabase } from "./actions/database/useDatabase";
import { useLogger } from "./logger";
import {
  DEFAULT_ENTRY_DURATION,
  DEFAULT_SUBMISSION_COOLDOWN,
  DEFAULT_SUBMISSION_MAX_QUANTITY
} from "./constants/queues";

const logger = useLogger();

export interface QueueEntry {
  queueMessageId: string;
  url: string;
  seconds: number;
  sentAt: Date;
  senderId: string;
  isDone: boolean;
}
export type UnsentQueueEntry = Omit<QueueEntry, "queueMessageId" | "isDone">;

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
    senderId: storedEntry.senderId,
    isDone: storedEntry.isDone
  };
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

  /** Fetches an entry with the given message ID. */
  fetchEntryFromMessage: (queueMessageId: string) => Promise<QueueEntry | null>;

  /** Fetches all entries in queue order. */
  fetchAll: () => Promise<Array<QueueEntry>>;

  /** Fetches the number of entries in the queue. */
  countAll: () => Promise<number>;

  /** Fetches all entries by the given user in order of submission. */
  fetchAllFrom: (senderId: string) => Promise<Array<QueueEntry>>;

  /** Fetches the lastest entry by the given user. */
  fetchLatestFrom: (senderId: string) => Promise<QueueEntry | null>;

  /** Fetches the number of entries from the given user in the queue. */
  countAllFrom: (senderId: string) => Promise<number>;

  /** Sets the entry's "done" value. */
  markEntryDone: (isDone: boolean, queueMessageId: string) => Promise<void>;

  /** Delete all entries for this queue channel. */
  clear: () => Promise<void>;
}

export async function useQueueStorage(
  queueChannel: Discord.TextChannel
): Promise<QueueEntryManager> {
  const db = await useDatabase();

  async function getConfig(transaction?: Transaction): Promise<QueueConfig> {
    const config = await db.QueueConfigs.findOne({
      where: {
        channelId: queueChannel.id
      },
      transaction
    });
    return {
      entryDurationSeconds: config?.entryDurationSeconds ?? DEFAULT_ENTRY_DURATION,
      cooldownSeconds: config?.cooldownSeconds ?? DEFAULT_SUBMISSION_COOLDOWN,
      submissionMaxQuantity: config?.submissionMaxQuantity ?? DEFAULT_SUBMISSION_MAX_QUANTITY
    };
  }

  async function getEntryWithMsgId(
    queueMessageId: string,
    transaction?: Transaction
  ): Promise<QueueEntry | null> {
    const doc = await db.QueueEntries.findOne({
      where: {
        channelId: queueChannel.id,
        guildId: queueChannel.guild.id,
        queueMessageId
      },
      transaction
    });
    return doc ? toQueueEntry(doc) : null;
  }

  return {
    queueChannel,
    getConfig,
    async updateConfig(config) {
      await db.sequelize.transaction(async transaction => {
        const oldConfig = await getConfig(transaction);

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

        let submissionMaxQuantity: number | null;
        if (config.submissionMaxQuantity === undefined) {
          submissionMaxQuantity = oldConfig.submissionMaxQuantity;
        } else {
          submissionMaxQuantity = config.submissionMaxQuantity;
        }
        await db.QueueConfigs.upsert(
          {
            channelId: queueChannel.id,
            entryDurationSeconds,
            cooldownSeconds,
            submissionMaxQuantity
          },
          { transaction }
        );
      });
    },
    async create(entry) {
      try {
        await db.sequelize.transaction(async transaction => {
          // Make sure the guild and channels are in there
          await db.Guilds.findOrCreate({
            where: {
              id: queueChannel.guild.id,
              currentQueue: queueChannel.id
            },
            defaults: {
              id: queueChannel.guild.id,
              currentQueue: queueChannel.id,
              isQueueOpen: false
            },
            transaction
          });
          await db.Channels.upsert(
            {
              id: queueChannel.id,
              guildId: queueChannel.guild.id
            },
            { transaction }
          );

          // Make sure we have at least the default config
          await db.QueueConfigs.findOrCreate({
            where: {
              channelId: queueChannel.id
            },
            defaults: {
              channelId: queueChannel.id,
              entryDurationSeconds: DEFAULT_ENTRY_DURATION,
              cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
              submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY
            },
            transaction
          });

          // Add the entry
          await db.QueueEntries.create(
            {
              queueMessageId: entry.queueMessageId,
              url: entry.url,
              seconds: entry.seconds,
              guildId: queueChannel.guild.id,
              channelId: queueChannel.id,
              senderId: entry.senderId,
              sentAt: entry.sentAt,
              isDone: entry.isDone
            },
            { transaction }
          );
        });
      } catch (error: unknown) {
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
      await db.QueueEntries.destroy({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          queueMessageId: entry.queueMessageId
        }
      });
    },
    async fetchEntryFromMessage(queueMessageId) {
      return getEntryWithMsgId(queueMessageId);
    },
    async fetchAll() {
      const entries = await db.QueueEntries.findAll({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        },
        order: [["sentAt", "ASC"]]
      });
      return entries.map(toQueueEntry);
    },
    countAll() {
      return db.QueueEntries.count({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        }
      });
    },
    async fetchAllFrom(senderId) {
      const entries = await db.QueueEntries.findAll({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          senderId
        },
        order: [["sentAt", "ASC"]]
      });
      return entries.map(toQueueEntry);
    },
    async fetchLatestFrom(senderId) {
      const entry = await db.QueueEntries.findOne({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          senderId
        },
        order: [["sentAt", "DESC"]]
      });
      const result = entry ? toQueueEntry(entry) : null;
      logger.verbose(
        `Latest submission from user ${senderId}: ${JSON.stringify(result, undefined, 2)}`
      );
      return result;
    },
    countAllFrom(senderId) {
      return db.QueueEntries.count({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id,
          senderId
        }
      });
    },
    async markEntryDone(isDone: boolean, queueMessageId: string) {
      logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
      await db.QueueEntries.update(
        { isDone },
        {
          where: {
            channelId: queueChannel.id,
            guildId: queueChannel.guild.id,
            queueMessageId
          }
        }
      );
    },
    async clear() {
      await db.QueueEntries.destroy({
        where: {
          channelId: queueChannel.id,
          guildId: queueChannel.guild.id
        }
      });
    }
  };
}
