import Discord from "discord.js";

export interface QueueEntry {
  queueMessageId: string | null;
  url: string;
  minutes: number;
  sentAt: Date;
  sender: Discord.User;
}

// FIXME: This should persist across restarts.
const cachedQueues = new Discord.Collection<string, Array<QueueEntry>>();

// eslint-disable-next-line @typescript-eslint/require-await
async function putQueue(guild: Discord.Guild, newQueue: Array<QueueEntry>) {
  cachedQueues.set(guild.id, newQueue);
  // TODO: Write the queue to disk (use a relational database?)
}

async function getQueue(guild: Discord.Guild): Promise<Array<QueueEntry>> {
  let theQueue = cachedQueues.get(guild.id);
  // TODO: If the queue is not cached, try to read the queue from disk (use a relational database?)
  if (!theQueue) {
    theQueue = [];
    await putQueue(guild, theQueue);
  }
  return theQueue;
}

interface QueueManager {
  count: () => Promise<number>;
  playtime: () => Promise<number>;
  push: (entry: QueueEntry) => Promise<void>;
  pop: () => Promise<QueueEntry | null>;
}

export function useQueue(queueChannel: Discord.TextChannel): QueueManager {
  const guild = queueChannel.guild;

  return {
    async count() {
      const queue = await getQueue(guild);
      return queue.length;
    },
    async playtime() {
      const queue = await getQueue(guild);
      let duration = 0;
      queue.forEach(e => {
        duration += e.minutes;
      });
      return duration;
    },
    async push(entry) {
      const queueMessage = await queueChannel.send(
        `<@!${entry.sender.id}> requested a **${Math.ceil(entry.minutes)}-min** song: ${entry.url}`,
        { allowedMentions: { users: [] } }
      );
      entry.queueMessageId = queueMessage.id;
      const theQueue = await getQueue(guild);
      theQueue.push(entry);
      await putQueue(guild, theQueue);
    },
    pop() {
      // Strikethrough the message
      // Mark the entry as "used"
      // If no unused entries exist, return null
      return Promise.resolve(null);
    }
  };
}
