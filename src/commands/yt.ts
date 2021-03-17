import type { Command } from "./index";
import ytdl from "ytdl-core";
import yts from "yt-search";
import { useLogger } from "../logger";

const logger = useLogger();

const yt: Command = {
  name: "yt",
  description: "Query YouTube for video data.",
  uses: [
    [
      "yt <search>",
      "Finds the first video that matches your search, and puts the link, the video title, and the video duration in chat."
    ],
    ["yt <link>", "Puts the video title and duration in chat."]
  ],
  async execute(context) {
    const { message, args } = context;
    async function reply(body: string) {
      await message.reply(body);
    }

    if (args.length < 1) {
      return reply("Invalid command structure. Expected a YouTube link or video ID");
    }
    let query = args[0];
    let videoId: string;

    try {
      if (ytdl.validateURL(query)) {
        videoId = ytdl.getURLVideoID(query);
        logger.info(`Got video ID '${videoId}'`);
        const video = await yts({ videoId });
        return reply(`${video.title}: (${video.duration.seconds / 60} mins)`);
      } else {
        query = args.join(" ");
        const { videos } = await yts(query);
        if (!videos.length) return reply("No songs were found!");
        const video = videos[0];
        return reply(`${video.url}\n${video.title}: (${video.duration.seconds / 60} mins)`);
      }
    } catch (error) {
      logger.error("Failed to run query", query, error);
      return reply("That video query gave me an error.");
    }
  }
};

export default yt;
