import type { GuildedCommand } from "./Command.js";
import type { Message } from "discord.js";
import type { SongRequest } from "../actions/queue/processSongRequest.js";
import { ApplicationCommandOptionType, hideLinkEmbed } from "discord.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { localizations, t } from "../i18n.js";
import { logUser } from "../helpers/logUser.js";
import { processSongRequest } from "../actions/queue/processSongRequest.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { URL } from "node:url";
import { useJobQueue } from "@averagehelper/job-queue";
import {
	deleteMessage,
	sendMessageInChannel,
	stopEscapingUriInString
} from "../actions/messages/index.js";

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
			reply,
			replyPrivately,
			prepareForLongRunningTasks,
			deleteInvocation
		} = context;

		const MENTION_SENDER = `<@!${user.id}>`;

		logger.debug(`Got song request message at ${createdTimestamp} from ${logUser(user)}`);

		const firstOption = options[0];
		if (!firstOption) {
			const { howto } = await import("./howto.js");
			return await howto.execute(context);
		}

		const escapedSongUrlString = resolveStringFromOption(firstOption).trim();
		const shouldHideEmbeds =
			escapedSongUrlString.startsWith("<") && escapedSongUrlString.endsWith(">");

		const songUrlString = shouldHideEmbeds
			? stopEscapingUriInString(escapedSongUrlString)
			: escapedSongUrlString;
		let songUrl: URL;
		let publicPreemptiveResponse: Promise<Message | null> = Promise.resolve(null);

		try {
			songUrl = new URL(songUrlString);
		} catch (error) {
			logger.error(`Could not parse URL string due to error: ${JSON.stringify(error)}`);
			// TODO: Be more specific. What kind of error?
			return await reply(
				`:hammer: ${MENTION_SENDER} ${t("commands.sr.responses.query-returned-error", guildLocale)}`
			);
		}

		if (channel && context.type === "interaction") {
			// The link hasn't been embedded yet, so embed it (unless the user has said not to do that)
			// This means we'll need to remember this message to delete it if the submission gets rejected
			// This should match the behavior of context.deleteInvocation() on `?sr`
			const href = shouldHideEmbeds ? hideLinkEmbed(songUrl.href) : songUrl.href;
			publicPreemptiveResponse = sendMessageInChannel(channel, {
				content: `${MENTION_SENDER}\n?${sr.name} ${href}`,
				allowedMentions: { users: [], repliedUser: false }
			});

			await prepareForLongRunningTasks(true);
		}

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			// Delete the preemptive message, if it exists
			const p = await publicPreemptiveResponse;
			if (p) {
				await deleteMessage(p);
			} else {
				await deleteInvocation();
			}

			await context.followUp({
				content: `:hammer: <@!${user.id}> ${t("common.queue.not-set-up", guildLocale)}`,
				reply: false
			});
			return;
		}

		if (channel?.id === queueChannel.id) {
			await Promise.all([
				deleteInvocation(),
				replyPrivately(
					t("commands.sr.responses.rejections.queue-channel-submission-not-implemented", userLocale)
				)
			]);
			return;
		}

		const isOpen = await isQueueOpen(guild);
		if (!isOpen) {
			// Delete the preemptive message, if it exists
			const p = await publicPreemptiveResponse;
			if (p) {
				await deleteMessage(p);
			} else {
				await deleteInvocation();
			}

			return await replyPrivately(
				`:hammer: ${MENTION_SENDER} ${t("common.queue.not-open", userLocale)}`
			);
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
		logger.debug(`Enqueued request for processing at ${Date.now()} from ${logUser(user)}`);
	}
};
