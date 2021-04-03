import Discord from "discord.js";
import { useDatabase, Database } from "./actions/database/useDatabase";
import { getEnv } from "./helpers/environment";

class GuildEntryManager {
  /** The guild. */
  public readonly guild: Discord.Guild;
  private readonly db: Database;

  constructor(guild: Discord.Guild, db: Database) {
    this.guild = guild;
    this.db = db;
  }

  /**
   * Retrives the list of Discord Role IDs whose members have permission to manage
   * the guild's queue limits, content, and open status.
   */
  async getQueueAdminRoles(): Promise<Array<string>> {
    return [
      getEnv("EVENTS_ROLE_ID") ?? "", //
      getEnv("QUEUE_ADMIN_ROLE_ID") ?? "" //
      // getEnv("BOT_ADMIN_ROLE_ID") ?? ""
    ];
  }

  /**
   * Retrieves the list of Discord Role IDs whose members have
   * permission to manage the guild.
   */
  async getGuildAdminRoles(): Promise<Array<string>> {
    return [
      getEnv("QUEUE_CREATOR_ROLE_ID") ?? "" //
      // getEnv("BOT_ADMIN_ROLE_ID") ?? ""
    ];
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
  async isQueueOpen(): Promise<boolean> {
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
