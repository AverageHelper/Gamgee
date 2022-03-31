import type Discord from "discord.js";
import type { GuildedCommand } from "./Command.js";
import type { SongRequest } from "../actions/queue/processSongRequest.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { isQueueOpen } from "../useGuildStorage.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { sendMessageInChannel } from "../actions/messages/index.js";
import { URL } from "url";
import { useJobQueue } from "@averagehelper/job-queue";
import processRequest from "../actions/queue/processSongRequest.js";

export const sr: GuildedCommand = {
	name: "sr",
	description: "Submit a song to the queue.",
	options: [
		{
			name: "url",
			description: "A track link from a supported platform",
			type: "STRING",
			required: true
		}
	],
	requiresGuild: true,
	async execute(context) {
		const {
			guild,
			channel,
			user,
			options,
			createdTimestamp,
			logger,
			reply,
			replyPrivately,
			prepareForLongRunningTasks,
			deleteInvocation
		} = context;

		const MENTION_SENDER = `<@!${user.id}>`;

		logger.debug(`Got song request message at ${createdTimestamp.toString()}`);
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			await context.followUp({
				content: `:hammer: <@!${user.id}> No queue is set up.`,
				reply: false
			});
			return;
		}

		const firstOption = options.data[0];
		if (!firstOption) {
			const howTo = (await import("./howto.js")).default;
			return howTo.execute(context);
		}

		if (channel?.id === queueChannel.id) {
			await Promise.all([
				deleteInvocation(),
				replyPrivately("Requesting songs in the queue channel has not been implemented yet.")
			]);
			return;
		}

		const isQueueNotOpen = !(await isQueueOpen(guild));
		if (isQueueNotOpen) {
			return reply({
				content: `:hammer: ${MENTION_SENDER} The queue is not open.`,
				ephemeral: true
			});
		}

		const songUrlString: string = resolveStringFromOption(firstOption);
		let songUrl: URL;
		let publicPreemptiveResponse: Discord.Message | null = null;

		try {
			songUrl = new URL(songUrlString);
		} catch (error: unknown) {
			logger.error(`Could not parse URL string due to error: ${JSON.stringify(error)}`);
			return reply(`:hammer: ${MENTION_SENDER} That request gave me an error. Try again maybe?`);
		}

		if (channel && context.type === "interaction") {
			// The link hasn't been embedded yet, so embed it
			// This means we'll need to remember this message to delete it if the submission gets rejected
			// This should match the behavior of context.deleteInvocation() on `?sr`
			await prepareForLongRunningTasks(true);

			publicPreemptiveResponse = await sendMessageInChannel(channel, {
				content: `${MENTION_SENDER}\n?sr ${songUrl.toString()}`,
				allowedMentions: { users: [], repliedUser: false }
			});
		}

		const requestQueue = useJobQueue<SongRequest>("urlRequest");
		requestQueue.process(processRequest); // Same function instance, so a nonce call

		requestQueue.createJob({ songUrl, context, queueChannel, publicPreemptiveResponse, logger });
	}
};

export default sr;
