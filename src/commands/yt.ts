import type { Command } from "./index";
import getVideoDetails from "../actions/getVideoDetails";
import { useLogger } from "../logger";

const logger = useLogger();

const name = "yt";

const yt: Command = {
  name,
  description: "Query YouTube for video data.",
  uses: [
    [
      `${name} {search terms}`,
      "Finds the first video that matches your search query, and puts the link, the video title, and the video duration in chat."
    ],
    [`${name} {link}`, "Puts the video title and duration in chat."]
  ],
  async execute(context) {
    const { message, args } = context;
    async function reply(body: string) {
      await message.reply(body);
    }

    if (args.length < 1) {
      return reply("You're gonna have to add a song link or title to that.");
    }

    try {
      const video = await getVideoDetails(args);
      if (video === null) {
        return reply("No songs were found!");
      }

      if ("type" in video && video.type === "video") {
        // Search result, so we haven't had this link embedded yet
        return reply(`${video.url}\n${video.title}: (${video.duration.seconds / 60} mins)`);
      }

      // The link is already embedded
      return reply(`${video.title}: (${video.duration.seconds / 60} mins)`);

      // Handle fetch errors
    } catch (error) {
      logger.error("Failed to run query", args, error);
      return reply("That video query gave me an error.");
    }
  }
};

export default yt;
