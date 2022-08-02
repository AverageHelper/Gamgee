import type { Command } from "./Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { getVideoDetails } from "../actions/getVideoDetails.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";

export const video: Command = {
	name: "video",
	description: "Reply with the video title and duration.",
	options: [
		{
			name: "url",
			description: "A track link from a supported platform",
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	requiresGuild: false,
	async execute(context) {
		const { logger, options, type, reply } = context;
		const firstOption = options[0];
		if (!firstOption) {
			return await reply({
				content: "You're gonna have to add a song link to that.",
				ephemeral: true
			});
		}
		const urlString: string = resolveStringFromOption(firstOption);

		const supportedPlatformsList =
			"https://github.com/AverageHelper/Gamgee#supported-music-platforms";
		const supportedPlatform =
			type === "interaction"
				? `[supported platform](<${supportedPlatformsList}>)`
				: "supported platform";

		try {
			const video = await getVideoDetails(urlString);
			if (video === null) {
				return await reply({
					content: `I couldn't get a song from that. Try a link from a ${supportedPlatform}.`,
					ephemeral: true
				});
			}

			const response = createPartialString();

			if (type === "interaction") {
				// We haven't had this link embedded yet
				push(video.url, response);
				pushNewLine(response);
			}

			push(video.title, response);
			push(": ", response);
			push(`(${durationString(video.duration.seconds)})`, response);

			return await reply(composed(response));

			// Handle fetch errors
		} catch (error) {
			logger.error(richErrorMessage(`Failed to run query for URL: ${urlString}`, error));
			return await reply("That video query gave me an error.");
		}
	}
};
