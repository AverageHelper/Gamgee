import type Discord from "discord.js";
import type { Repository } from "typeorm";
import { Channel, Guild, QueueConfig, QueueEntry } from "./database/model";
import { useRepository, useTransaction } from "./database/useDatabase";
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
    return useRepository(QueueConfig, repo => this._getConfig(repo));
  }

  /** Updates the provided properties of a queue's configuration settings. */
  async updateConfig(config: Partial<QueueConfig>): Promise<void> {
    await useTransaction(async transaction => {
      const queueConfigs = transaction.getRepository(QueueConfig);
      const oldConfig = await this._getConfig(queueConfigs);

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
      const newConfig = new QueueConfig(this.queueChannel.id, {
        entryDurationSeconds,
        cooldownSeconds,
        submissionMaxQuantity
      });
      await transaction.save(newConfig);
    });
  }

  /** Adds the queue entry to the database. */
  async create(entry: Omit<QueueEntry, "channelId" | "guildId">): Promise<QueueEntry> {
    return useTransaction(async transaction => {
      const guilds = transaction.getRepository(Guild);
      const queueConfigs = transaction.getRepository(QueueConfig);

      // Make sure the guild and channels are in there
      const guild =
        (await guilds.findOne({
          where: {
            id: this.queueChannel.guild.id
          }
        })) ?? new Guild(this.queueChannel.guild.id, false, this.queueChannel.id);
      await transaction.save(guild);

      const channel = new Channel(this.queueChannel.id, this.queueChannel.guild.id);
      await transaction.save(channel);

      // Make sure we have at least the default config
      const config =
        (await queueConfigs.findOne({
          where: {
            channelId: this.queueChannel.id
          }
        })) ??
        new QueueConfig(this.queueChannel.id, {
          entryDurationSeconds: DEFAULT_ENTRY_DURATION,
          cooldownSeconds: DEFAULT_SUBMISSION_COOLDOWN,
          submissionMaxQuantity: DEFAULT_SUBMISSION_MAX_QUANTITY
        });
      await transaction.save(config);

      // Add the entry
      const queueEntries = transaction.getRepository(QueueEntry);
      const queueEntry = new QueueEntry(this.queueChannel.id, this.queueChannel.guild.id, entry);
      return queueEntries.save(queueEntry);
    });
  }

  /** Removes the queue entry from the database. */
  async removeEntryFromMessage(queueMessageId: string): Promise<void> {
    await useRepository(QueueEntry, repo =>
      repo.delete({
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId
      })
    );
  }

  /** Fetches an entry with the given message ID. */
  async fetchEntryFromMessage(queueMessageId: string): Promise<QueueEntry | null> {
    return useRepository(QueueEntry, repo => this._getEntryWithMsgId(queueMessageId, repo));
  }

  /** Fetches all entries in queue order. */
  async fetchAll(): Promise<Array<QueueEntry>> {
    return useRepository(QueueEntry, repo =>
      repo.find({
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
    return useRepository(QueueEntry, repo =>
      repo.count({
        where: {
          channelId: this.queueChannel.id,
          guildId: this.queueChannel.guild.id
        }
      })
    );
  }

  /** Fetches all entries by the given user in order of submission. */
  async fetchAllFrom(senderId: string): Promise<Array<QueueEntry>> {
    return useRepository(QueueEntry, repo =>
      repo.find({
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
    const entry = await useRepository(QueueEntry, repo =>
      repo.findOne({
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
    return useRepository(QueueEntry, repo =>
      repo.count({
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
    await useRepository(QueueEntry, repo =>
      repo.update(
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
    await useRepository(QueueEntry, repo =>
      repo.delete({
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id
      })
    );
  }

  private async _getEntryWithMsgId(
    queueMessageId: string,
    repo: Repository<QueueEntry>
  ): Promise<QueueEntry | null> {
    const doc = await repo.findOne({
      where: {
        channelId: this.queueChannel.id,
        guildId: this.queueChannel.guild.id,
        queueMessageId
      }
    });
    return doc ?? null;
  }

  private async _getConfig(repo: Repository<QueueConfig>): Promise<QueueConfig> {
    const config = await repo.findOne({
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
