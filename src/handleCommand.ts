import type { Storage } from "./configStorage";
import type { Logger } from "./logger";
import type { Command, CommandContext, MessageCommandInteractionOption } from "./commands";
import Discord from "discord.js";
import { getEnv } from "./helpers/environment";
import { getConfigCommandPrefix } from "./actions/config/getConfigValue";
import { randomGreeting, randomHug, randomPhrase, randomQuestion } from "./helpers/randomStrings";
import { invokeCommand } from "./actions/invokeCommand";
import { allCommands as commands } from "./commands";
import { deleteMessage, reply, replyPrivately, sendMessageInChannel } from "./actions/messages";
import getUserIdFromMention from "./helpers/getUserIdFromMention";
import logUser from "./helpers/logUser";

interface QueryMessage {
	/** The command and its arguments. */
	query: Array<string>;
	/** Whether the user used the regular command prefix or a user mention. */
	usedCommandPrefix: boolean;
}

/**
 * Parses a message and returns a command query if one exists.
 *
 * If the message starts with a ping to the bot, then we assume no command prefix
 * and return the message verbatim as a query. Otherwise, we check the first word
 * for the command prefix. If that exists, then the prefix is trimmed and the message
 * is returned as a query.
 *
 * Non-query messages will resolve to an `undefined` query, and should be ignored.
 *
 * @param client The Discord client.
 * @param message The message to parse.
 * @param storage The bot's persistent storage.
 *
 * @returns The command query. The first argument is the command name, and the rest are arguments.
 */
async function query(
	client: Discord.Client,
	message: Discord.Message,
	storage: Storage | null,
	logger: Logger
): Promise<QueryMessage | null> {
	const content = message.content.trim();
	const query = content.split(/ +/u);

	const commandOrMention = query[0];
	if (commandOrMention === undefined || commandOrMention === "") return null;

	const mentionedUserId = getUserIdFromMention(commandOrMention);
	if (mentionedUserId !== null) {
		// See if it's for us.
		if (client.user && mentionedUserId === client.user.id) {
			logger.debug("They're talking to me!");
			// It's for us. Return the query verbatim.
			return { query: query.slice(1), usedCommandPrefix: false };
		}

		// It's not for us.
		logger.debug("They're not talking to me. Ignoring.");
		return null;
	}

	// Make sure it's a command
	const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
	if (!content.startsWith(COMMAND_PREFIX)) {
		logger.debug("They're not talking to me. Ignoring.");
		return null;
	}
	query[0] = query[0]?.slice(COMMAND_PREFIX.length) ?? "";

	return { query, usedCommandPrefix: true };
}

export function optionsFromArgs(
	args: Array<string>
): Discord.Collection<string, MessageCommandInteractionOption> {
	const options = new Discord.Collection<string, MessageCommandInteractionOption>();

	// one argument
	const firstArg = args.shift();
	if (firstArg !== undefined) {
		const subcommand: MessageCommandInteractionOption = {
			name: firstArg,
			type: "STRING",
			value: firstArg,
			options: new Discord.Collection()
		};
		options.set(subcommand.name, subcommand);
		while (args.length > 0) {
			// two arguments or more
			const name = args.shift() as string;
			const nextOption: MessageCommandInteractionOption = {
				name,
				type: "STRING",
				value: name,
				options: new Discord.Collection()
			};
			subcommand.type = "SUB_COMMAND";
			subcommand.options?.set(nextOption.name, nextOption);
		}
	}

	return options;
}

/**
 * Performs actions from a Discord message. The command is ignored if the
 * message is from a bot or the message does not begin with the guild's
 * configured command prefix.
 *
 * @param client The Discord client.
 * @param message The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleCommand(
	client: Discord.Client,
	message: Discord.Message,
	storage: Storage | null,
	logger: Logger
): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		message.author.bot &&
		(message.author.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test")
	) {
		logger.silly("Momma always said not to talk to strangers. They could be *bots* ");
		return;
	}

	// Ignore self messages
	if (message.author.id === message.client.user?.id) return;

	// Don't bother with empty messages
	const content = message.content.trim();
	if (!content) return;

	logger.debug(
		`User ${logUser(message.author)} sent message: '${content.slice(0, 20)}${
			content.length > 20 ? "...' (trimmed)" : "'"
		}`
	);

	// Don't bother with regular messages
	const pq = await query(client, message, storage, logger);
	if (!pq) return;
	const { query: q, usedCommandPrefix } = pq;

	if (q.length === 0) {
		// This is a query for us to handle (we might've been pinged), but it's empty.
		await message.reply(randomQuestion());
		return;
	}

	// Get the command
	const commandName = q[0]?.toLowerCase() ?? "";
	if (!commandName) return;

	const command: Command | undefined = commands.get(commandName);
	if (command) {
		const options = optionsFromArgs(q.slice(1));

		logger.debug(
			`Calling command handler '${command.name}' with options ${JSON.stringify(
				options,
				undefined,
				2
			)}`
		);

		const context: CommandContext = {
			type: "message",
			createdTimestamp: message.createdTimestamp,
			user: message.author,
			guild: message.guild,
			channel: message.channel,
			client,
			message,
			options,
			storage,
			logger,
			prepareForLongRunningTasks: (ephemeral?: boolean) => {
				if (ephemeral === undefined || !ephemeral) {
					void message.channel.startTyping();
					logger.debug(
						`Started typing in channel ${message.channel.id} due to Context.prepareForLongRunningTasks`
					);
				}
			},
			replyPrivately: async (content: string) => {
				const didReply = await replyPrivately(message, content, true);
				if (!didReply) {
					logger.info(`User ${logUser(message.author)} has DMs turned off.`);
				}
				message.channel.stopTyping(true);
			},
			reply: async (content: string, options) => {
				await reply(message, content, options?.shouldMention);
				message.channel.stopTyping(true);
			},
			followUp: async (content: string, options = {}) => {
				if (options.ephemeral === true) {
					await replyPrivately(message, content, true);
				} else {
					await sendMessageInChannel(message.channel, content);
				}
				message.channel.stopTyping(true);
			},
			deleteInvocation: async () => {
				await deleteMessage(message);
			},
			startTyping: (count?: number) => {
				void message.channel.startTyping(count);
				logger.debug(`Started typing in channel ${message.channel.id} due to Context.startTyping`);
			},
			stopTyping: () => message.channel.stopTyping(true)
		};

		return invokeCommand(command, context);
	}

	const messageContainsWord = (str: string): boolean => q.map(s => s.toLowerCase()).includes(str);
	const messageContainsOneOfWords = (strs: Array<string>): boolean =>
		q.map(s => s.toLowerCase()).some(s => strs.includes(s));

	if (!usedCommandPrefix) {
		// This is likely a game. Play along!
		void message.channel.startTyping();
		logger.debug(
			`Started typing in channel ${message.channel.id} due to handleCommand receiving a game`
		);
		await new Promise(resolve => setTimeout(resolve, 2000));
		if (messageContainsWord("hello")) {
			await message.channel.send(randomGreeting());
		} else if (messageContainsOneOfWords(["hug", "hug?", "hugs", "hugs?"])) {
			await message.channel.send(randomHug());
		} else {
			await message.channel.send(randomPhrase());
		}
		message.channel.stopTyping(true);
	}
}
