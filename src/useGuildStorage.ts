import { getEnv } from "./helpers/environment";
import type Discord from "discord.js";
import { Guild } from "./database/model";
import { useDatabase, useDatabaseTransaction } from "./database/useDatabase";

class GuildEntryManager {
  /** The guild. */
  public readonly guild: Discord.Guild;

  constructor(guild: Discord.Guild) {
    this.guild = guild;
  }

  /**
   * Retrives the list of Discord Role IDs whose members have permission to manage
   * the guild's queue limits, content, and open status.
   */
  async getQueueAdminRoles(): Promise<Array<string>> {
    // TODO: Get all Role entry IDs such that the entry has isQueueAdmin: true
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
    // TODO: Get all Role entry IDs such that the entry has isGuildAdmin: true
    return [
      getEnv("QUEUE_CREATOR_ROLE_ID") ?? "" //
      // getEnv("BOT_ADMIN_ROLE_ID") ?? ""
    ];
  }

  /** Retrieves the guild's queue channel ID, if it exists.. */
  async getQueueChannelId(): Promise<string | null> {
    const guildInfo = await useDatabase(manager =>
      manager.findOne(Guild, {
        where: {
          id: this.guild.id
        }
      })
    );
    return guildInfo?.currentQueue ?? null;
  }

  /** Sets the guild's queue channel. */
  async setQueueChannel(channel: Discord.TextChannel | string | null): Promise<void> {
    let currentQueue: string | null;

    if (channel === null || typeof channel === "string") {
      currentQueue = channel;
    } else {
      currentQueue = channel.id;
    }

    await useDatabaseTransaction(async transaction => {
      const guildInfo = await transaction.findOne(Guild, {
        where: {
          id: this.guild.id
        }
      });

      await transaction
        .createQueryBuilder()
        .insert()
        .into(Guild)
        .values({
          id: this.guild.id,
          currentQueue,
          isQueueOpen: guildInfo?.isQueueOpen ?? false
        })
        .orUpdate({
          conflict_target: ["id"],
          overwrite: ["currentQueue", "isQueueOpen"]
        })
        .execute();
    });
  }

  /** Get's the queue's current open status. */
  async isQueueOpen(): Promise<boolean> {
    const guildInfo = await useDatabase(manager =>
      manager.findOne(Guild, {
        where: {
          id: this.guild.id
        }
      })
    );
    return guildInfo?.isQueueOpen ?? false;
  }

  /** Sets the guild's queue-open status. */
  async setQueueOpen(isOpen: boolean): Promise<void> {
    const guildInfo = await useDatabase(manager =>
      manager.findOne(Guild, {
        where: {
          id: this.guild.id
        }
      })
    );
    if (
      isOpen &&
      (guildInfo?.currentQueue === undefined ||
        guildInfo.currentQueue === null ||
        guildInfo.currentQueue === "")
    ) {
      throw new Error("Cannot open a queue without a queue to open.");
    }
    await useDatabase(manager =>
      manager.update(
        Guild,
        {
          id: this.guild.id
        },
        { isQueueOpen: isOpen }
      )
    );
  }
}

export function useGuildStorage(guild: Discord.Guild): GuildEntryManager {
  return new GuildEntryManager(guild);
}
