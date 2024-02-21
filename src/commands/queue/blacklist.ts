import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType, userMention } from "discord.js";
import { getCommandPrefix } from "../../useGuildStorage.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { getStoredQueueConfig, saveUserToStoredBlacklist } from "../../useQueueStorage.js";
import { logUser } from "../../helpers/logUser.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "../../constants/database.js";
import { resolveUserFromOption } from "../../helpers/optionResolvers.js";
import { whitelist } from "./whitelist.js";
import {
	composed,
	createPartialString,
	push,
	pushCode,
	pushNewLine,
} from "../../helpers/composeStrings.js";

// TODO: i18n
export const blacklist: Subcommand = {
	name: "blacklist",
	description: "Show the list of blacklisted users, or add a user to the blacklist.",
	options: [
		{
			name: "user",
			description: "Block the user from making song requests",
			type: ApplicationCommandOptionType.User,
			required: false,
		},
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute({ type, guild, user, options, logger, reply, replyPrivately, deleteInvocation }) {
		const { quo: parentCommand } = await import("./index.js");

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return await reply({ content: ":x: There's no queue set up yet.", ephemeral: true });
		}

		const firstOption = options[0];
		if (!firstOption) {
			if (type === "message") {
				logger.debug("Private-ness for message commands is restricted to DMs.");
				// We can reply to text messages twice, since the second one will be a DM. We `await` here, not `return`.
				await reply(":paperclip: Check the list in your DMs");
			}

			const queueConfig = await getStoredQueueConfig(queueChannel);
			const blacklistedUsers = queueConfig.blacklistedUsers?.map(user => user.id) ?? [];

			const prefix =
				type === "interaction" ? SLASH_COMMAND_INTENT_PREFIX : await getCommandPrefix(guild);
			const guildName = guild.name.trim();

			const replyMsg = createPartialString(); // TODO: i18n

			push(`**Song Request Blacklist for *${guildName}***`, replyMsg);
			pushNewLine(replyMsg);
			if (blacklistedUsers.length === 0) {
				push(" - Nobody. (Let's hope it remains this way.)", replyMsg);
				pushNewLine(replyMsg);
			}

			blacklistedUsers.forEach(userId => {
				push(` - ${userMention(userId)}`, replyMsg);
				pushNewLine(replyMsg);
			});

			pushNewLine(replyMsg);
			push("To add a user to the blacklist, run ", replyMsg);
			pushCode(`${prefix}${parentCommand.name} ${blacklist.name} <user mention>`, replyMsg);
			push(".", replyMsg);

			pushNewLine(replyMsg);
			push("To remove a user from the blacklist, run ", replyMsg);
			pushCode(`${prefix}${parentCommand.name} ${whitelist.name} <user mention>`, replyMsg);
			push(".", replyMsg);
			pushNewLine(replyMsg);
			if (type === "message") {
				// These are DMs. Be clear about where to run commands.
				push("(Run these in ", replyMsg);
				push(`*${guildName}*`, replyMsg);
				push(", obviously)", replyMsg);
			}

			return await replyPrivately(composed(replyMsg));
		}

		await deleteInvocation();

		const subject = await resolveUserFromOption(firstOption, guild);
		if (!subject) {
			return await reply({ content: ":x: I don't know who that is.", ephemeral: true }); // TODO: i18n
		}

		if (subject.id === user.id) {
			return await reply({ content: ":x: You can't blacklist yourself, silly!", ephemeral: true }); // TODO: i18n
		}

		if (subject.id === guild.ownerId) {
			return await reply({
				content: ":x: I can't blacklist the owner. That would be rude!",
				ephemeral: true,
			});
		}

		await saveUserToStoredBlacklist(subject.id, queueChannel);
		logger.info(`Removed song request permission from user ${logUser(subject)}.`);

		return await reply({
			content: `:pirate_flag: <@!${subject.id}> is no longer allowed to submit song requests.`,
			shouldMention: false,
			ephemeral: true,
		}); // TODO: i18n
	},
};
