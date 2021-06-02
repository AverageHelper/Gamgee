import type { Command } from "./Command";
import getVideoDetails from "../actions/getVideoDetails";
import durationString from "../helpers/durationString";
import StringBuilder from "../helpers/StringBuilder";
import richErrorMessage from "../helpers/richErrorMessage";
import { resolveStringFromOption } from "../helpers/optionResolvers";
import { isNonEmptyArray } from "../helpers/guards";

const video: Command = {
	name: "video",
	description: "Reply with the video title and duration.",
	options: [
		{
			name: "url",
			description: "A YouTube, SoundCloud, or Bandcamp link",
			type: "STRING",
			required: true
		}
	],
	requiresGuild: false,
	async execute(context) {
		const { logger, options, reply } = context;
		if (!isNonEmptyArray(options)) {
			return reply("You're gonna have to add a song link to that.");
		}
		const url: string = resolveStringFromOption(options[0]);

		try {
			const video = await getVideoDetails(url);
			if (video === null) {
				return reply("I couldn't get a song from that.");
			}

			const response = new StringBuilder();

			if (!video.fromUrl || context.type === "interaction") {
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
			logger.error(richErrorMessage(`Failed to run query for URL: ${url}`, error));
			return reply("That video query gave me an error.");
		}
	}
};

export default video;
