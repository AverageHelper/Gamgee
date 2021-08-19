import type { Subcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";
import { resolveChannelFromOption } from "../../helpers/optionResolvers";

const setup: Subcommand = {
	name: "setup",
	description: "Set a channel as the 'queue' channel.",
	options: [
		{
			name: "channel",
			description: "The channel to use as the 'queue' channel for the server",
			type: "CHANNEL",
			required: true
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin"],
	async execute({ guild, options, logger, prepareForLongRunningTasks, reply, deleteInvocation }) {
		await deleteInvocation();

		const firstOption = options.data[0];
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

		const guildStorage = useGuildStorage(guild);
		logger.info(`Setting up channel '${newQueueChannel.name}' for queuage.`);
		await Promise.all([
			guildStorage.setQueueChannel(newQueueChannel.id),
			newQueueChannel.send("This is a queue now. :smiley:")
		]);
		return reply({ content: `New queue set up in <#${newQueueChannel.id}>`, ephemeral: true });
	}
};

export default setup;
