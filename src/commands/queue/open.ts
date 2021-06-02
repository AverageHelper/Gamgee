import type { Subcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const open: Subcommand = {
	name: "open",
	description: "Start accepting song requests to the queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({ guild, channel, reply, deleteInvocation }) {
		const guildStorage = useGuildStorage(guild);
		const [queueChannel] = await Promise.all([
			getQueueChannel(guild), //
			deleteInvocation()
		]);

		if (!queueChannel) {
			return reply("There's no queue to open. Have you set one up yet?", { ephemeral: true });
		}
		const isAlreadyOpen = await guildStorage.isQueueOpen();
		if (isAlreadyOpen) {
			return reply("The queue's already open! :smiley:", { ephemeral: true });
		}

		await guildStorage.setQueueOpen(true);

		const queueIsCurrent = channel?.id === queueChannel.id;
		await queueChannel.send("This queue is now open! :smiley:");
		if (!queueIsCurrent) {
			return reply(`The queue is now open! :smiley:`);
		}
	}
};

export default open;
