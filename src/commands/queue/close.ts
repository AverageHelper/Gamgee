import type { GuildedSubcommand } from "../Command.js";
import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
import getQueueChannel from "../../actions/queue/getQueueChannel.js";

const close: GuildedSubcommand = {
	name: "close",
	description: "Stop accepting song requests to the queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute({ guild, channel, type, reply, followUp, deleteInvocation }) {
		const [isQueueAlreadyOpen, queueChannel] = await Promise.all([
			isQueueOpen(guild),
			getQueueChannel(guild),
			deleteInvocation()
		]);

		if (!queueChannel) {
			return reply({
				content: "There's no queue to close. Have you set one up yet?",
				ephemeral: true
			});
		}
		if (!isQueueAlreadyOpen) {
			return reply({
				content: "The queue is already closed, silly! :stuck_out_tongue:",
				ephemeral: true
			});
		}

		const queueIsCurrent = channel?.id === queueChannel.id;
		const promises: Array<Promise<unknown>> = [setQueueOpen(false, guild)];
		if (!queueIsCurrent) {
			promises.push(queueChannel.send("This queue is closed. :wave:"));
		}
		if (type === "interaction") {
			promises.push(reply({ content: "Got it!", ephemeral: true }));
		}
		await Promise.all(promises);
		await followUp({ content: "The queue is now closed. :wave:", reply: false });
	}
};

export default close;
