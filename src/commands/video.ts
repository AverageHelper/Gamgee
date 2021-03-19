import type { Command } from "./index";
import { useLogger } from "../logger";
import getVideoDetails from "../actions/getVideoDetails";
import durationString from "../helpers/durationString";
import StringBuilder from "../helpers/StringBuilder";

const logger = useLogger();

const name = "video";

const video: Command = {
  name,
  description: "Query YouTube or SoundCloud for video data.",
  uses: [[`${name} {link}`, "Puts the video title and duration in chat."]],
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
        return reply("I couldn't get a song from that.");
      }

      const response = new StringBuilder();

      if (!video.fromUrl) {
        // We haven't had this link embedded yet
        response.push(video.url);
        response.pushNewLine();
      }

      response.push(video.title);
      response.push(": ");
      response.push(`(${durationString(video.duration.seconds)})`);
      return reply(response.result());

      // Handle fetch errors
    } catch (error) {
      logger.error(
        `Failed to run query: ${JSON.stringify(args)}, ${JSON.stringify(error, undefined, 2)}`
      );
      return reply("That video query gave me an error.");
    }
  }
};

export default video;