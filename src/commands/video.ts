import type { Command } from "./Command";
import { useLogger } from "../logger";
import getVideoDetails from "../actions/getVideoDetails";
import durationString from "../helpers/durationString";
import StringBuilder from "../helpers/StringBuilder";

const logger = useLogger();

const name = "video";

const video: Command = {
  name,
  requiredArgFormat: "<YouTube or SoundCloud link>",
  description: "Put the video title and duration in chat.",
  async execute(context) {
    const { message, args } = context;
    async function reply(body: string): Promise<void> {
      await message.reply(body);
    }

    if (args.length === 0) {
      return reply("You're gonna have to add a song link to that.");
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
    } catch (error: unknown) {
      logger.error(
        `Failed to run query: ${JSON.stringify(args)}, ${JSON.stringify(error, undefined, 2)}`
      );
      return reply("That video query gave me an error.");
    }
  }
};

export default video;
