import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { bulkDeleteMessagesWithIds } from "../../actions/messages/index.js";
import { deleteStoredEntriesForQueue, getAllStoredEntries } from "../../useQueueStorage.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";

// TODO: i18n
export const restart: Subcommand = {
	name: "restart",
	description: "Empty the queue and start a fresh queue session.",
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({ guild, prepareForLongRunningTasks, reply }) {
		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return await reply("No queue is set up. Maybe that's what you wanted...?");
		}

		await prepareForLongRunningTasks();

		const toBeDeleted = (await getAllStoredEntries(queueChannel)) //
			.map(entry => entry.queueMessageId);
		const didDelete = await bulkDeleteMessagesWithIds(toBeDeleted, queueChannel);
		if (!didDelete) {
			return await reply("Something went wrong. I couldn't get that queue cleared, sorry.");
		}
		await deleteStoredEntriesForQueue(queueChannel);

		return await reply("The queue has restarted.");
	}
};
