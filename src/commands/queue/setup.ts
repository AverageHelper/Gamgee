import type { Subcommand } from "../Command.js";
import { setQueueChannel } from "../../useGuildStorage.js";
import { resolveChannelFromOption } from "../../helpers/optionResolvers.js";

export const setup: Subcommand = {
	name: "setup",
	description: "Set a channel as the 'queue' channel.",
	options: [
		{
			name: "channel",
			description: "The channel to use as the 'queue' channel for the server",
			type: "CHANNEL",
			channelTypes: ["GUILD_TEXT"],
			required: true
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: true,
	// permissions: ["owner", "admin"], // TODO: Make this a separate command so that only server admins can use it by default
	async execute({ guild, options, logger, prepareForLongRunningTasks, reply, deleteInvocation }) {
		await deleteInvocation();

		const firstOption = options[0];
		if (!firstOption) {
			return reply({
				content: `Please name a text channel to use for the queue!`,
				ephemeral: true
			});
		}

		const newQueueChannel = resolveChannelFromOption(firstOption, guild);
		if (!newQueueChannel) {
			return reply({
				content:
					"That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`.",
				ephemeral: true
			});
		}

		if (!newQueueChannel.isText()) {
			return reply({
				content: "I can't queue in a voice channel. Please specify a text channel instead",
				ephemeral: true
			});
		}

		await prepareForLongRunningTasks(true);

		logger.info(`Setting up channel '${newQueueChannel.name}' for queuage.`);
		await Promise.all([
			setQueueChannel(newQueueChannel.id, guild),
			newQueueChannel.send("This is a queue now. :smiley:")
		]);
		return reply({ content: `New queue set up in <#${newQueueChannel.id}>`, ephemeral: true });
	}
};
