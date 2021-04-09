import type Discord from "discord.js";
import type { EntityManager } from "typeorm";
import { Channel, Guild, QueueConfig, QueueEntry } from "./database/model";
import { useDatabase, useDatabaseTransaction } from "./database/useDatabase";
import { useLogger } from "./logger";
import {
  DEFAULT_ENTRY_DURATION,
  DEFAULT_SUBMISSION_COOLDOWN,
  DEFAULT_SUBMISSION_MAX_QUANTITY
} from "./constants/queues";

const logger = useLogger();

export type { QueueEntry };
export type UnsentQueueEntry = Omit<
  QueueEntry,
  "queueMessageId" | "isDone" | "channelId" | "guildId"
>;

export class QueueEntryManager {
  /** The channel for this queue. */
  private readonly queueChannel: Discord.TextChannel;

  constructor(queueChannel: Discord.TextChannel) {
    this.queueChannel = queueChannel;
  }

  /** Retrieves the queue's configuration settings. */
  async getConfig(): Promise<QueueConfig> {
    return useDatabase(manager => this._getConfig(manager));
  }

  /** Updates the provided properties of a queue's configuration settings. */
  async updateConfig(config: Partial<QueueConfig>): Promise<void> {
    await useDatabaseTransaction(async transaction => {
      const oldConfig = await this._getConfig(transaction);

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
      const newConfig = {
        channelId: this.queueChannel.id,
        entryDurationSeconds,
        cooldownSeconds,
        submissionMaxQuantity
      };
      await transaction
        .createQueryBuilder()
        .insert()
        .into(QueueConfig)
        .values(newConfig)
        .orUpdate({
          conflict_target: ["channelId"],
          overwrite: ["entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity"]
        })
        .execute();
    });
  }

  /** Adds the queue entry to the database. */
  async create(entry: Omit<QueueEntry, "channelId" | "guildId">): Promise<QueueEntry> {
    return useDatabaseTransaction(async transaction => {
      // Make sure the guild and channels are in there
      await transaction
        .createQueryBuilder()
        .insert()
        .into(Guild)
        .values({
          id: this.queueChannel.guild.id,
          currentQueue: this.queueChannel.id,
          isQueueOpen: false
        })
        .orUpdate({
          conflict_target: ["id"],
          overwrite: ["currentQueue", "isQueueOpen"]
        })
        .execute();
      await transaction
        .createQueryBuilder()
        .insert()
        .into(Channel)
        .values({
          id: this.queueChannel.id,
          guildId: this.queueChannel.guild.id
        })
        .orUpdate({
          conflict_target: ["id"],
          overwrite: ["guildId"]
        })
        .execute();

      // Make sure we have at least the default config
      await transaction
        .createQueryBuilder()
        .insert()
        .into(QueueConfig)
        .values({
          channelId: this.queueChannel.id,
          entryDurationSeconds: DEFAULT_ENTRY_DURATION,
          cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
          submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY
        })
        .orUpdate({
          conflict_target: ["channelId"],
          overwrite: ["entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity"]
        })
        .execute();

      // Add the entry
      return transaction.create(QueueEntry, {
        ...entry,
        guildId: this.queueChannel.guild.id,
        channelId: this.queueChannel.id
      });
    });
  }

  /** Removes the queue entry from the database. */
  async remove(entry: QueueEntry): Promise<void> {
    await useDatabase(manager =>
      manager.delete(QueueEntry, {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId: entry.queueMessageId
      })
    );
  }

  /** Fetches an entry with the given message ID. */
  async fetchEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
    return useDatabase(manager => this._getEntryWithMsgId(queueMessageId, manager));
  }

  /** Fetches all entries in queue order. */
  async fetchAll(): Promise<Array<QueueEntry>> {
    return useDatabase(manager =>
      manager.find(QueueEntry, {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id
        },
        order: { sentAt: "ASC" }
      })
    );
  }

  /** Fetches the number of entries in the queue. */
  async countAll(): Promise<number> {
    return useDatabase(manager =>
      manager.count(QueueEntry, {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id
        }
      })
    );
  }

  /** Fetches all entries by the given user in order of submission. */
  async fetchAllFrom(senderId: string): Promise<Array<QueueEntry>> {
    return useDatabase(manager =>
      manager.find(QueueEntry, {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id,
          senderId
        },
        order: { sentAt: "ASC" }
      })
    );
  }

  /** Fetches the lastest entry by the given user. */
  async fetchLatestFrom(senderId: string): Promise<QueueEntry | null> {
    const entry = await useDatabase(manager =>
      manager.findOne(QueueEntry, {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id,
          senderId
        },
        order: { sentAt: "DESC" }
      })
    );
    // const entry = await this.db.QueueEntries.findOne({});
    const result = entry ?? null;
    logger.verbose(
      `Latest submission from user ${senderId}: ${JSON.stringify(result, undefined, 2)}`
    );
    return result;
  }

  /** Fetches the number of entries from the given user in the queue. */
  async countAllFrom(senderId: string): Promise<number> {
    return useDatabase(manager =>
      manager.count(QueueEntry, {
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id,
          senderId
        }
      })
    );
  }

  /** Sets the entry's "done" value. */
  async markEntryDone(isDone: boolean, queueMessageId: string): Promise<void> {
    logger.debug(`Marking entry ${queueMessageId} as ${isDone ? "" : "not "}done`);
    await useDatabase(manager =>
      manager.update(
        QueueEntry,
        {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id,
          queueMessageId
        },
        { isDone }
      )
    );
  }

  /** Delete all entries for this queue channel. */
  async clear(): Promise<void> {
    await useDatabase(manager =>
      manager.delete(QueueEntry, {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id
      })
    );
  }

  private async _getEntryWithMsgId(
    queueMessageId: string,
    manager: EntityManager
  ): Promise<QueueEntry | null> {
    const doc = await manager.findOne(QueueEntry, {
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId
      }
    });
    return doc ?? null;
  }

  private async _getConfig(entityManager: EntityManager): Promise<QueueConfig> {
    const config = await entityManager.findOne(QueueConfig, {
      where: {
        channelId: this.queueChannel.id
      }
    });
    return {
      channelId: config?.channelId ?? this.queueChannel.id,
      entryDurationSeconds: config?.entryDurationSeconds ?? DEFAULT_ENTRY_DURATION,
      cooldownSeconds: config?.cooldownSeconds ?? DEFAULT_SUBMISSION_COOLDOWN,
      submissionMaxQuantity: config?.submissionMaxQuantity ?? DEFAULT_SUBMISSION_MAX_QUANTITY
    };
  }
}

export function useQueueStorage(queueChannel: Discord.TextChannel): QueueEntryManager {
  return new QueueEntryManager(queueChannel);
}
