import type { Command } from "./Command";
import { resolveStringFromOption } from "../helpers/optionResolvers";
import getVideoDetails from "../actions/getVideoDetails";
import durationString from "../helpers/durationString";
import richErrorMessage from "../helpers/richErrorMessage";
import StringBuilder from "../helpers/StringBuilder";

const video: Command = {
	name: "video",
	description: "Reply with the video title and duration.",
	options: [
		{
			name: "url",
			description: "A YouTube, SoundCloud, Bandcamp, or Odysee link",
			type: "STRING",
			required: true
		}
	],
	requiresGuild: false,
	async execute(context) {
		const { logger, options, reply } = context;
		const firstOption = options.data[0];
		if (!firstOption) {
			return reply({ content: "You're gonna have to add a song link to that.", ephemeral: true });
		}
		const urlString: string = resolveStringFromOption(firstOption);

		try {
			const video = await getVideoDetails(urlString);
			if (video === null) {
				return reply({ content: "I couldn't get a song from that.", ephemeral: true });
			}

			const response = new StringBuilder();

			if (context.type === "interaction") {
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
			logger.error(richErrorMessage(`Failed to run query for URL: ${urlString}`, error));
			return reply("That video query gave me an error.");
		}
	}
};

export default video;
