import type { CommandContext } from "../../commands";
import type Discord from "discord.js";
import richErrorMessage from "../../helpers/richErrorMessage";
import { useGuildStorage } from "../../useGuildStorage";
import { useLogger } from "../../logger";

const logger = useLogger();

async function getQueueChannelFromCommand(
	context: CommandContext
): Promise<Discord.TextChannel | null> {
	if (!context.guild) return null;

	const guildInfo = useGuildStorage(context.guild);

	const queueChannelId = await guildInfo.getQueueChannelId();
	if (queueChannelId === null || !queueChannelId) return null;

	let queueChannel: Discord.Channel | null;
	try {
		queueChannel = await context.client.channels.fetch(queueChannelId);
	} catch (error: unknown) {
		logger.error(richErrorMessage("Failed to fetch queue channel.", error));
		await context.reply(
			"The configured channel doesn't exist. Have an administrator set the queue back up."
		);
		return null;
	}

	if (!queueChannel) return null;

	if (!queueChannel.isText()) {
		logger.error("The configured channel is not a text channel.");
		await context.reply(
			"The configured channel is not a text channel. Have an administrator set up the queue again."
		);
		return null;
	}

	return queueChannel as Discord.TextChannel;
}

async function getQueueChannelFromGuild(guild: Discord.Guild): Promise<Discord.TextChannel | null> {
	const guildInfo = useGuildStorage(guild);

	const queueChannelId = await guildInfo.getQueueChannelId();
	if (queueChannelId === null || !queueChannelId) {
		return null;
	}

	let queueChannel: Discord.TextChannel;
	try {
		queueChannel = (await guild.client.channels.fetch(queueChannelId)) as Discord.TextChannel;
	} catch (error: unknown) {
		logger.error(richErrorMessage("Failed to fetch queue channel.", error));
		return null;
	}

	if (!queueChannel.isText()) {
		logger.error("The configured channel is not a text channel.");
		return null;
	}

	return queueChannel;
}

/**
 * Retrieves the configured queue channel. Returns `null` if none has been set up yet.
 *
 * This action may send error messages to the message's channel.
 *
 * @param source The guild or command invocation from which to derive a queue channel.
 *
 * @returns the guild's queue channel, or `null` if it has none.
 */
export default async function getQueueChannel(
	source: CommandContext | Discord.Guild | null
): Promise<Discord.TextChannel | null> {
	if (!source) return null;
	if ("type" in source) return getQueueChannelFromCommand(source);
	return getQueueChannelFromGuild(source);
}
