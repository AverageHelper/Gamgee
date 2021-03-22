import Discord from "discord.js";
import { useDatabase } from "./actions/database/useDatabase";

interface GuildEntryManager {
  /** The guild. */
  guild: Discord.Guild;

  /** Retrieves the guild's queue channel ID, if it exists.. */
  getQueueChannelId: () => Promise<string | null>;

  /** Sets the guild's queue channel. */
  setQueueChannel: (channel: Discord.TextChannel | string | null) => Promise<void>;

  /** Get's the queue's current open status. */
  getQueueOpen: () => Promise<boolean>;

  /** Sets the guild's queue-open status. */
  setQueueOpen: (isOpen: boolean) => Promise<void>;
}

export async function useGuildStorage(guild: Discord.Guild): Promise<GuildEntryManager> {
  const db = await useDatabase();

  return {
    guild,

    async getQueueChannelId() {
      const queueInfo = await db.Guilds.findOne({
        where: {
          id: guild.id
        }
      });
      return queueInfo?.currentQueue ?? null;
    },

    async setQueueChannel(channel) {
      let currentQueue: string | null;

      if (channel === null || typeof channel === "string") {
        currentQueue = channel;
      } else {
        currentQueue = channel.id;
      }

      const guildInfo = await db.Guilds.findOne({
        where: {
          id: guild.id
        }
      });
      await db.Guilds.upsert({
        id: guild.id,
        currentQueue,
        isQueueOpen: guildInfo?.isQueueOpen ?? false
      });
    },

    async getQueueOpen() {
      const queueInfo = await db.Guilds.findOne({
        where: {
          id: guild.id
        }
      });
      return queueInfo?.isQueueOpen ?? false;
    },

    async setQueueOpen(isOpen) {
      const guildInfo = await db.Guilds.findOne({
        where: {
          id: guild.id
        }
      });
      if (isOpen && !guildInfo?.currentQueue) {
        throw new Error("Cannot open a queue without a queue to open.");
      }
      await db.Guilds.update(
        { isQueueOpen: isOpen },
        {
          where: { id: guild.id }
        }
      );
    }
  };
}
