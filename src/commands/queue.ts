import type { Command } from "./index";
import ytdl from "ytdl-core";
import yts from "yt-search";
import { useLogger } from "../logger";

const logger = useLogger();

const yt: Command = {
  name: "queue",
  description: "Manage a user queue.",
  uses: [
    [
      "queue {channel name}",
      "Tells me to use the channel called {channel name} for the queue. The previous queue will be forgotten."
    ],
    ["queue reset-limits", "Resets all submission limits for the queue."],
    [
      "queue total-limit {number}",
      "Sets a default limit to the number of total submissions that any user may put in the queue."
    ]
  ],
  async execute(context) {
    const { client, message, args } = context;

    // Get the queue channel
    // const channel = await client.channels.fetch(queueChannelId);

    async function accept() {
      // Add the message content to the queue
      await message.channel.send(`**${message.author.username}**, Submission Accepted!`);
    }
    async function reject(reason: string) {
      await message.channel.send(reason);
    }

    if (args.length < 1) {
      return reject("Invalid command structure. Expected a YouTube link or video ID");
    }
    let query = args[0];
    let videoId: string;

    try {
      if (ytdl.validateURL(query)) {
        videoId = ytdl.getURLVideoID(query);
        logger.info(`Got video ID '${videoId}'`);
        const video = await yts({ videoId });
        return reject(`${video.title}: (${video.duration.seconds / 60} mins)`);
      } else {
        query = args.join(" ");
        const { videos } = await yts(query);
        if (!videos.length) return reject("No songs were found!");
        const video = videos[0];
        return reject(`${video.url}\n${video.title}: (${video.duration.seconds / 60} mins)`);
      }
    } catch (error) {
      logger.error("Failed to run query", query, error);
      return reject("That video query gave me an error.");
    }
  }
};

export default yt;
