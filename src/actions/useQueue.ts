import type Discord from "discord.js";

export interface QueueEntry {
  queueMessageId: string | null;
  url: string;
  minutes: number;
  sentAt: Date;
  sender: Discord.User;
}

// TODO: Store multiple queues by channel ID.
// FIXME: This should persist across restarts.
const theQueue: Array<QueueEntry> = [];

interface QueueManager {
  count: () => Promise<number>;
  playtime: () => Promise<number>;
  push: (entry: QueueEntry) => Promise<void>;
  pop: () => Promise<QueueEntry | null>;
}

export function useQueue(queueChannel: Discord.TextChannel): QueueManager {
  return {
    count() {
      return Promise.resolve(theQueue.length);
    },
    playtime() {
      let duration = 0;
      theQueue.forEach(e => {
        duration += e.minutes;
      });
      return Promise.resolve(duration);
    },
    async push(entry) {
      const queueMessage = await queueChannel.send(
        `<@!${entry.sender.id}> requested a **${Math.ceil(entry.minutes)}-min** song: ${entry.url}`,
        { allowedMentions: { users: [] } }
      );
      entry.queueMessageId = queueMessage.id;
      theQueue.push(entry);
    },
    pop() {
      // Strikethrough the message
      // Mark the entry as "used"
      // If no unused entries exist, return null
      return Promise.resolve(null);
    }
  };
}
