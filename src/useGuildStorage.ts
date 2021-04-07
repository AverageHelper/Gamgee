import type Discord from "discord.js";
import type { Database } from "./actions/database/useDatabase";
import { useDatabase } from "./actions/database/useDatabase";

class GuildEntryManager {
  /** The guild. */
  public readonly guild: Discord.Guild;
  private readonly db: Database;

  constructor(guild: Discord.Guild, db: Database) {
    this.guild = guild;
    this.db = db;
  }

  /** Retrieves the guild's queue channel ID, if it exists.. */
  async getQueueChannelId(): Promise<string | null> {
    const queueInfo = await this.db.Guilds.findOne({
      where: {
        id: this.guild.id
      }
    });
    return queueInfo?.currentQueue ?? null;
  }

  /** Sets the guild's queue channel. */
  async setQueueChannel(channel: Discord.TextChannel | string | null): Promise<void> {
    let currentQueue: string | null;

    if (channel === null || typeof channel === "string") {
      currentQueue = channel;
    } else {
      currentQueue = channel.id;
    }

    const guildInfo = await this.db.Guilds.findOne({
      where: {
        id: this.guild.id
      }
    });
    await this.db.Guilds.upsert({
      id: this.guild.id,
      currentQueue,
      isQueueOpen: guildInfo?.isQueueOpen ?? false
    });
  }

  /** Get's the queue's current open status. */
  async getQueueOpen(): Promise<boolean> {
    const queueInfo = await this.db.Guilds.findOne({
      where: {
        id: this.guild.id
      }
    });
    return queueInfo?.isQueueOpen ?? false;
  }

  /** Sets the guild's queue-open status. */
  async setQueueOpen(isOpen: boolean): Promise<void> {
    const guildInfo = await this.db.Guilds.findOne({
      where: {
        id: this.guild.id
      }
    });
    if (
      isOpen &&
      (guildInfo?.currentQueue === undefined ||
        guildInfo.currentQueue === null ||
        guildInfo.currentQueue === "")
    ) {
      throw new Error("Cannot open a queue without a queue to open.");
    }
    await this.db.Guilds.update(
      { isQueueOpen: isOpen },
      {
        where: { id: this.guild.id }
      }
    );
  }
}

export async function useGuildStorage(guild: Discord.Guild): Promise<GuildEntryManager> {
  const db = await useDatabase();
  return new GuildEntryManager(guild, db);
}
