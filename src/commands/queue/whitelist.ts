import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { logUser } from "../../helpers/logUser.js";
import { resolveUserFromOption } from "../../helpers/optionResolvers.js";
import { whitelistUser } from "../../useQueueStorage.js";

// TODO: i18n
export const whitelist: Subcommand = {
	name: "whitelist",
	description: "Allows a previously-blacklisted user to make song requests.",
	options: [
		{
			name: "user",
			description: "The user to allow to request songs.",
			type: ApplicationCommandOptionType.User,
			required: true
		}
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute({ user, guild, options, logger, reply, deleteInvocation }) {
		await deleteInvocation();

		const firstOption = options[0];
		if (!firstOption) {
			return await reply({
				content: ":x: You'll need to tell me who to whitelist. Try again, and mention someone.",
				ephemeral: true
			});
		}

		const [subject, queueChannel] = await Promise.all([
			resolveUserFromOption(firstOption, guild),
			getQueueChannel(guild)
		]);

		if (!subject) {
			return await reply({ content: ":x: I don't know who that is.", ephemeral: true });
		}

		if (subject.id === user.id) {
			return await reply({ content: ":x: You can't whitelist yourself, silly!", ephemeral: true });
		}

		if (!queueChannel) {
			return await reply({ content: ":x: There's no queue set up yet.", ephemeral: true });
		}

		await whitelistUser(subject.id, queueChannel);
		logger.info(`Restored song request permission to user ${logUser(subject)}.`);

		return await reply({
			content: `:checkered_flag: <@!${subject.id}> is allowed to submit song requests! :grin:`,
			shouldMention: false,
			ephemeral: true
		});
	}
};
