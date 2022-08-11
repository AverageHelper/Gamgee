import type { GuildedSubcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";

export const open: GuildedSubcommand = {
	name: "open",
	description: "Start accepting song requests to the queue.",
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({ guild, channel, type, reply, followUp, deleteInvocation }) {
		const [queueChannel] = await Promise.all([
			getQueueChannel(guild), //
			deleteInvocation()
		]);

		if (!queueChannel) {
			return await reply({
				content: "There's no queue to open. Have you set one up yet?",
				ephemeral: true
			});
		}
		const isAlreadyOpen = await isQueueOpen(guild);
		if (isAlreadyOpen) {
			return await reply({ content: "The queue's already open! :smiley:", ephemeral: true });
		}

		await setQueueOpen(true, guild);

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
