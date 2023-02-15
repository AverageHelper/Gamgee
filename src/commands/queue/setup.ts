import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType, channelMention, ChannelType } from "discord.js";
import { resolveChannelFromOption } from "../../helpers/optionResolvers.js";
import { setQueueChannel } from "../../useGuildStorage.js";

// TODO: i18n
export const setup: Subcommand = {
	name: "setup",
	description: "Set a channel as the 'queue' channel.",
	options: [
		{
			name: "channel",
			description: "The channel to use as the 'queue' channel for the server",
			type: ApplicationCommandOptionType.Channel,
			channelTypes: [ChannelType.GuildText],
			required: true
		}
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin"],
	async execute({ guild, options, logger, prepareForLongRunningTasks, reply, deleteInvocation }) {
		await deleteInvocation();

		const firstOption = options[0];
		if (!firstOption) {
			return await reply({
				content: `Please name a text channel to use for the queue!`,
				ephemeral: true
			});
		}

		const newQueueChannel = resolveChannelFromOption(firstOption, guild);
		if (!newQueueChannel) {
			return await reply({
				content:
					"That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`.",
				ephemeral: true
			});
		}

		if (!newQueueChannel.isTextBased()) {
			return await reply({
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
		return await reply({
			content: `New queue set up in ${channelMention(newQueueChannel.id)}`,
			ephemeral: true
		});
	}
};
