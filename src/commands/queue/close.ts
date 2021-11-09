import type { GuildedSubcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const close: GuildedSubcommand = {
	name: "close",
	description: "Stop accepting song requests to the queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute({ guild, channel, type, reply, followUp, deleteInvocation }) {
		const guildStorage = useGuildStorage(guild);
		const [isQueueOpen, queueChannel] = await Promise.all([
			guildStorage.isQueueOpen(),
			getQueueChannel(guild),
			deleteInvocation()
		]);

		if (!queueChannel) {
			return reply({
				content: "There's no queue to close. Have you set one up yet?",
				ephemeral: true
			});
		}
		if (!isQueueOpen) {
			return reply({
				content: "The queue is already closed, silly! :stuck_out_tongue:",
				ephemeral: true
			});
		}

		const queueIsCurrent = channel?.id === queueChannel.id;
		const promises: Array<Promise<unknown>> = [guildStorage.setQueueOpen(false)];
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
