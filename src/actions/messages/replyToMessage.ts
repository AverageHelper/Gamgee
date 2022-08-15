import type Discord from "discord.js";
import { ChannelType, DiscordAPIError } from "discord.js";
import { composed, createPartialString, push, pushNewLine } from "../../helpers/composeStrings.js";
import { getEnv } from "../../helpers/environment.js";
import { logUser } from "../../helpers/logUser.js";
import { richErrorMessage } from "../../helpers/richErrorMessage.js";
import { useLogger } from "../../logger.js";

const logger = useLogger();

// TODO: i18n

/**
 * Attempts to send a direct message to the given user. If Discord throws
 * an error at the attempt, then the error is logged, and the returned
 * `Promise` resolves to `false`.
 *
 * The current channel name is automatically prepended to the message content.
 *
 * @param user The user to whom to reply.
 * @param content The content of the message to send.
 *
 * @returns a `Promise` that resolves with `true` if the send succeeds, or
 * `false` if there was an error.
 */
export async function sendPrivately(
	user: Discord.User,
	content: string
): Promise<Discord.Message | null> {
	if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
		// this is our known tester
		logger.error(
			`I'm sure ${user.username} is a nice person, but I should not send DMs to a bot. I don't know how to report this.`
		);
		return null;
	} else if (!user.bot) {
		logger.verbose(`Sent DM to User ${logUser(user)}: ${content}`);
		return await sendDM(user, content);
	}
	return null;
}

/**
 * Attempts to send a direct message to a user.
 *
 * @param user The user to DM.
 * @param content The message to send.
 *
 * @returns `true` if the DM was successful. `false` if there was an error.
 * This will be the case if the target user has DMs disabled.
 */
async function sendDM(
	user: Discord.User,
	content: string | Discord.MessageOptions
): Promise<Discord.Message | null> {
	try {
		return await user.send(content);
	} catch (error) {
		logger.error(
			richErrorMessage(`Failed to send direct message to user ${logUser(user)}.`, error)
		);
		return null;
	}
}

function replyMessage(
	source: Discord.TextBasedChannel | null,
	content: string | null | undefined
): string {
	const msg = createPartialString();
	if (source && source.type !== ChannelType.DM) {
		push(`(Reply from <#${source.id}>)`, msg);
		pushNewLine(msg);
	}
	push(content ?? "", msg);
	return composed(msg);
}

async function sendDMReply(
	source: Discord.Message,
	options: string | Discord.ReplyMessageOptions
): Promise<Discord.Message | null> {
	const user: Discord.User = source.author;
	try {
		if (user.bot && user.id === getEnv("CORDE_BOT_ID")) {
			// this is our known tester
			logger.silly(`Good morning, Miss ${user.username}.`);

			if (typeof options === "string") {
				return await reply(source, {
					content: `(DM to <@!${user.id}>)\n${options}`
				});
			}
			return await reply(source, {
				...options,
				content: `(DM to <@!${user.id}>)\n${options.content ?? ""}`
			});
		} else if (!user.bot) {
			logger.silly("This is a human. Or their dog... I love dogs!");
			const content = typeof options !== "string" ? options.content ?? null : options;
			const response = replyMessage(source.channel, content);
			if (typeof options === "string") {
				return await sendDM(user, response);
			}
			return await sendDM(user, { ...options, content: response });
		}
		logger.error(
			`I'm sure ${user.username} is a nice person, but they are a bot. I should not send DMs to a bot. I don't know how to report this to you, so here's an error!`
		);
		return null;
	} catch (error) {
		logger.error(
			richErrorMessage(`Failed to send direct message to user ${logUser(user)}.`, error)
		);
		return null;
	}
}

async function sendEphemeralReply(
	source: Discord.CommandInteraction,
	options: string | Discord.InteractionReplyOptions
): Promise<boolean> {
	// Returns boolean and not message, because we cannot fetch ephemeral messages
	try {
		if (typeof options === "string") {
			await source.reply({ content: options, ephemeral: true });
		} else {
			await source.reply({ ...options, ephemeral: true });
		}
		logger.verbose(
			`Sent ephemeral reply to User ${logUser(source.user)}: ${JSON.stringify(options)}`
		);
		return true;
	} catch (error) {
		logger.error(richErrorMessage(`Failed to send ephemeral message.`, error));
		return false;
	}
}

/**
 * Attempts to send a direct message to the author of the given message. If
 * Discord throws an error at the attempt, then the error is logged, and
 * the returned `Promise` resolves to `false`.
 *
 * The current channel name is automatically prepended to the message content.
 *
 * @param source The message or interaction to which to reply.
 * @param options The the message to send.
 * @param preferDMs If `source` is an interaction, then we'll reply via DMs anyway.
 *
 * @returns a `Promise` that resolves with a reference to the message sent,
 * or a boolean value indicating whether an ephemeral reply succeeded or failed.
 */
export async function replyPrivately(
	source: Discord.Message | Discord.CommandInteraction,
	options: string | Omit<Discord.MessageOptions, "reply" | "flags">,
	preferDMs: boolean
): Promise<Discord.Message | boolean> {
	let message: Discord.Message | null;

	// If this is a message (no ephemeral reply option)
	if ("author" in source) {
		message = await sendDMReply(source, options);

		// If this is an interaction, but we really wanna use DMs
	} else if (preferDMs) {
		if (typeof options === "string") {
			message = await sendDM(source.user, replyMessage(source.channel, options));
		} else {
			message = await sendDM(source.user, {
				...options,
				content: replyMessage(source.channel, options.content)
			});
		}

		// If this is an interaction, reply ephemerally
	} else {
		return await sendEphemeralReply(source, options);
	}

	// If the DM was attempted and failed
	if (message === null) {
		// Inform the user that we tried to DM them, but they have their DMs off
		if ("author" in source) {
			await source.channel?.send(
				`<@!${source.author.id}> I tried to DM you just now, but it looks like your DMs are off. :slight_frown:`
			);
		} else {
			return await sendEphemeralReply(source, options);
		}
		return false;
	}

	return message;
}

/**
 * Attempts to send a message in the provided channel.
 *
 * @param channel The text channel in which to send the message.
 * @param content The message to send.
 */
export async function sendMessageInChannel(
	channel: Discord.TextBasedChannel,
	content: string | Discord.MessageOptions
): Promise<Discord.Message | null> {
	try {
		return await channel.send(content);
	} catch (error) {
		logger.error(richErrorMessage(`Failed to send message ${JSON.stringify(content)}.`, error));
		return null;
	}
}

/**
 * Sends a message in the same channel as the provided `message` with a
 * mention to the sender.
 *
 * @param message The message to which to reply.
 * @param content The content of the message to send.
 * @param shouldMention Whether the user should be pinged with the reply.
 *
 * @returns a `Promise` that resolves if the send succeeds.
 */
export async function reply(
	message: Discord.Message,
	content: string | Discord.ReplyMessageOptions,
	shouldMention: boolean = true
): Promise<Discord.Message | null> {
	try {
		if (shouldMention) {
			return await message.reply(content);
		}
		if (typeof content === "string") {
			return await message.reply({ content, allowedMentions: { users: [] } });
		}
		return await message.reply({ ...content, allowedMentions: { users: [] } });
	} catch (error) {
		if (error instanceof DiscordAPIError && error.message.includes("message_reference")) {
			logger.debug(
				`The message ${message.id} must have been deleted. Sending reply in same channel.`
			);
			return await sendMessageInChannel(message.channel, content);
		}
		logger.error(richErrorMessage(`Failed to send message ${JSON.stringify(content)}.`, error));
		return null;
	}
}
