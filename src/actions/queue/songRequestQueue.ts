import type Discord from "discord.js";
import type { JobQueue } from "./jobQueue";
import { jobQueues, useJobQueue } from "./jobQueue";

export function useSongRequestQueue(
  userId: string,
  queueChannel: Discord.TextChannel
): JobQueue<Discord.Message> {
  const key = `${userId}_${queueChannel.id}`;
  const queue = useJobQueue<Discord.Message>(key);
  queue.on("start", () => {
    void queueChannel.startTyping();
  });
  queue.on("finish", () => {
    jobQueues.delete(key);
    void queueChannel.stopTyping(true);
  });
  return queue;
}
