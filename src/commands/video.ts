import type { Command } from "./Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { composed, createPartialString, push, pushNewLine } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { getVideoDetails } from "../actions/getVideoDetails.js";
import { localizations } from "../i18n.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { stopEscapingUriInString } from "../actions/messages/editMessage.js";

// TODO: i18n
export const video: Command = {
	name: "video",
	nameLocalizations: localizations("commands.video.name"),
	description: "Reply with the video title and duration.",
	descriptionLocalizations: localizations("commands.video.description"),
	options: [
		{
			name: "url",
			nameLocalizations: localizations("commands.sr.options.url.name"),
			description: "A song link from a supported platform",
			descriptionLocalizations: localizations("commands.sr.options.url.description"),
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	requiresGuild: false,
	async execute(context) {
		const { guildLocale, logger, options, type, reply } = context;
		const firstOption = options[0];
		if (!firstOption) {
			return await reply({
				content: "You're gonna have to add a song link to that.",
				ephemeral: true
			});
		}
		const escapedSongUrlString = resolveStringFromOption(firstOption).trim();
		const shouldHideEmbeds =
			escapedSongUrlString.startsWith("<") && escapedSongUrlString.endsWith(">");
		const urlString = shouldHideEmbeds
			? stopEscapingUriInString(escapedSongUrlString)
			: escapedSongUrlString;

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
				if (shouldHideEmbeds) {
					// If the user doesn't want it embedded, don't embed
					push(`<${video.url}>`, response);
				} else {
					push(video.url, response);
				}
				pushNewLine(response);
			}

			push(video.title, response);
			push(": ", response);
			push(`(${durationString(guildLocale, video.duration.seconds)})`, response);

			return await reply(composed(response));

			// Handle fetch errors
		} catch (error) {
			logger.error(richErrorMessage(`Failed to run query for URL: ${urlString}`, error));
			return await reply("That video query gave me an error.");
		}
	}
};
