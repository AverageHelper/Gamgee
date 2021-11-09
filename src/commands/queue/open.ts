import type { GuildedSubcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import getQueueChannel from "../../actions/queue/getQueueChannel";

const open: GuildedSubcommand = {
	name: "open",
	description: "Start accepting song requests to the queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({ guild, channel, type, reply, followUp, deleteInvocation }) {
		const guildStorage = useGuildStorage(guild);
		const [queueChannel] = await Promise.all([
			getQueueChannel(guild), //
			deleteInvocation()
		]);

		if (!queueChannel) {
			return reply({
				content: "There's no queue to open. Have you set one up yet?",
				ephemeral: true
			});
		}
		const isAlreadyOpen = await guildStorage.isQueueOpen();
		if (isAlreadyOpen) {
			return reply({ content: "The queue's already open! :smiley:", ephemeral: true });
		}

		await guildStorage.setQueueOpen(true);

		const queueIsCurrent = channel?.id === queueChannel.id;
		await queueChannel.send("This queue is now open! :smiley:");
		if (!queueIsCurrent) {
			if (type === "interaction") {
				await reply({ content: "Got it!", ephemeral: true });
			}
			await followUp({ content: "The queue is now open! :smiley:", reply: false });
		}
	}
};

export default open;
