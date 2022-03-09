import type { Subcommand } from "../Command.js";
import { bulkDeleteMessagesWithIds } from "../../actions/messages/index.js";
import { clearEntries, fetchAllEntries } from "../../useQueueStorage.js";
import getQueueChannel from "../../actions/queue/getQueueChannel.js";

const restart: Subcommand = {
	name: "restart",
	description: "Empty the queue and start a fresh queue session.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({ guild, prepareForLongRunningTasks, reply }) {
		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return reply("No queue is set up. Maybe that's what you wanted...?");
		}

		await prepareForLongRunningTasks();

		const toBeDeleted = (await fetchAllEntries(queueChannel)).map(entry => entry.queueMessageId);
		await bulkDeleteMessagesWithIds(toBeDeleted, queueChannel);
		await clearEntries(queueChannel);

		return reply("The queue has restarted.");
	}
};

export default restart;
