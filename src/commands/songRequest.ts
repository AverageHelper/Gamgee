import type Discord from "discord.js";
import type { GuildedCommand } from "./Command.js";
import type { SongRequest } from "../actions/queue/processSongRequest.js";
import { ApplicationCommandOptionType, hideLinkEmbed } from "discord.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { localizations, t } from "../i18n.js";
import { processSongRequest } from "../actions/queue/processSongRequest.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { sendMessageInChannel, stopEscapingUriInString } from "../actions/messages/index.js";
import { URL } from "node:url";
import { useJobQueue } from "@averagehelper/job-queue";

// TODO: i18n
export const sr: GuildedCommand = {
	name: "sr",
	nameLocalizations: localizations("commands.sr.name"),
	description: "Submit a song to the queue.",
	descriptionLocalizations: localizations("commands.sr.description"),
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
	requiresGuild: true,
	async execute(context) {
		const {
			guild,
			guildLocale,
			channel,
			user,
			userLocale,
			options,
			createdTimestamp,
			logger,
			type,
			reply,
			replyPrivately,
			prepareForLongRunningTasks,
			deleteInvocation
		} = context;

		const MENTION_SENDER = `<@!${user.id}>`;

		logger.debug(`Got song request message at ${createdTimestamp}`);
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			await context.followUp({
				content: `:hammer: <@!${user.id}> ${t("common.queue.not-set-up", guildLocale)}`,
				reply: false
			});
			return;
		}

		const firstOption = options[0];
		if (!firstOption) {
			const { howto } = await import("./howto.js");
			return await howto.execute(context);
		}

		if (channel?.id === queueChannel.id) {
			await Promise.all([
				deleteInvocation(),
				replyPrivately("Requesting songs in the queue channel has not been implemented yet.") // TODO: I18N
			]);
			return;
		}

		const isOpen = await isQueueOpen(guild);
		if (!isOpen) {
			const locale = type === "interaction" ? userLocale : guildLocale;
			return await reply({
				content: `:hammer: ${MENTION_SENDER} ${t("common.queue.not-open", locale)}`,
				ephemeral: true
			});
		}

		const escapedSongUrlString = resolveStringFromOption(firstOption).trim();
		const shouldHideEmbeds =
			escapedSongUrlString.startsWith("<") && escapedSongUrlString.endsWith(">");
		const songUrlString = shouldHideEmbeds
			? stopEscapingUriInString(escapedSongUrlString)
			: escapedSongUrlString;
		let songUrl: URL;
		let publicPreemptiveResponse: Discord.Message | null = null;

		try {
			songUrl = new URL(songUrlString);
		} catch (error) {
			logger.error(`Could not parse URL string due to error: ${JSON.stringify(error)}`);
			return await reply(
				`:hammer: ${MENTION_SENDER} That request gave me an error. Try again maybe?`
			);
		}

		if (channel && context.type === "interaction") {
			// The link hasn't been embedded yet, so embed it
			// This means we'll need to remember this message to delete it if the submission gets rejected
			// This should match the behavior of context.deleteInvocation() on `?sr`
			await prepareForLongRunningTasks(true);

			// Post the link. If the user doesn't want embeds, don't embed
			const href = shouldHideEmbeds ? hideLinkEmbed(songUrl.href) : songUrl.href;
			publicPreemptiveResponse = await sendMessageInChannel(channel, {
				content: `${MENTION_SENDER}\n?sr ${href}`,
				allowedMentions: { users: [], repliedUser: false }
			});
		}

		const requestQueue = useJobQueue<SongRequest>("urlRequest");
		requestQueue.process(processSongRequest); // Same function instance, so a nonce call

		requestQueue.createJob({
			songUrl,
			context,
			queueChannel,
			publicPreemptiveResponse,
			logger
		});
	}
};
