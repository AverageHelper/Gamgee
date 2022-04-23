import type { Command, CommandContext, MessageCommandInteractionOption } from "./commands/index.js";
import type { Logger } from "./logger.js";
import type { Storage } from "./configStorage.js";
import type { Response, ResponseContext } from "./helpers/randomStrings.js";
import { getEnv } from "./helpers/environment.js";
import { getConfigCommandPrefix } from "./actions/config/getConfigValue.js";
import { invokeCommand } from "./actions/invokeCommand.js";
import { resolveAlias, allCommands as commands } from "./commands/index.js";
import Discord from "discord.js";
import getUserIdFromMention from "./helpers/getUserIdFromMention.js";
import logUser from "./helpers/logUser.js";
import {
	deleteMessage,
	reply,
	replyPrivately,
	sendMessageInChannel
} from "./actions/messages/index.js";
import {
	randomGreeting,
	randomHug,
	randomPhrase,
	randomQuestion,
	unwrappingWith
} from "./helpers/randomStrings.js";

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
	client: Discord.Client,
	args: Array<string>
): Discord.CommandInteractionOptionResolver {
	const options: Array<MessageCommandInteractionOption> = [];

	// one argument
	const firstArg = args.shift();
	if (firstArg !== undefined) {
		const subcommand: MessageCommandInteractionOption = {
			name: firstArg,
			type: "STRING",
			value: firstArg,
			options: []
		};
		options.push(subcommand);
		while (args.length > 0) {
			// two arguments or more
			const name = args.shift() as string;
			const nextOption: MessageCommandInteractionOption = {
				name,
				type: "STRING",
				value: name,
				options: []
			};
			subcommand.type = "SUB_COMMAND";
			subcommand.options?.push(nextOption);
		}
	}

	return new Discord.CommandInteractionOptionResolver(client, options);
}

async function responseContext(
	message: Discord.Message,
	client: Discord.Client
): Promise<ResponseContext> {
	let me: string;
	const otherUser = message.author;
	const otherMember = (await message.guild?.members.fetch(otherUser)) ?? null;

	if (client.user) {
		me = (await message.guild?.members.fetch(client.user.id))?.nickname ?? client.user.username;
	} else {
		me = "Me";
	}

	return { me, otherUser, otherMember };
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
		logger.debug("Momma always said not to talk to strangers. They could be *bots* ");
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
		const ctx = await responseContext(message, client);
		return await unwrappingWith(ctx, randomQuestion(), r => message.reply(r));
	}

	// Get the command
	const commandName = q[0]?.toLowerCase() ?? "";
	if (!commandName) return;

	const dealiasedCommandName = resolveAlias(commandName);
	const command: Command | undefined = commands.get(dealiasedCommandName);
	if (command) {
		const options = optionsFromArgs(client, q.slice(1));

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
					void message.channel.sendTyping();
					logger.debug(
						`Started typing in channel ${message.channel.id} due to Context.prepareForLongRunningTasks`
					);
				}
			},
			replyPrivately: async options => {
				const reply = await replyPrivately(message, options, true);
				if (reply === null) {
					logger.info(`User ${logUser(message.author)} has DMs turned off.`);
				}
			},
			reply: async options => {
				if (typeof options === "string") {
					await reply(message, options);
				} else {
					await reply(message, options, options?.shouldMention);
				}
			},
			followUp: async options => {
				if (typeof options !== "string" && "ephemeral" in options && options.ephemeral === true) {
					return await replyPrivately(message, options, true);
				}
				return (await sendMessageInChannel(message.channel, options)) ?? false;
			},
			deleteInvocation: async () => {
				await deleteMessage(message);
			},
			sendTyping: () => {
				void message.channel.sendTyping();
				logger.debug(`Started typing in channel ${message.channel.id} due to Context.sendTyping`);
			}
		};

		return invokeCommand(command, context);
	}

	const messageContainsWord = (str: string): boolean => q.map(s => s.toLowerCase()).includes(str);
	const messageContainsOneOfWords = (strs: Array<string>): boolean =>
		q.map(s => s.toLowerCase()).some(s => strs.includes(s));

	if (!usedCommandPrefix) {
		// This is likely a game. Play along!
		void message.channel.sendTyping();
		logger.debug(
			`Started typing in channel ${message.channel.id} due to handleCommand receiving a game`
		);
		await new Promise(resolve => setTimeout(resolve, 2000));

		let wrapped: Response;

		if (messageContainsWord("hello")) {
			wrapped = randomGreeting();
		} else if (
			messageContainsOneOfWords(["hug", "hug?", "hugs", "hugs?", "*hugs", "hugs*", "*hugs*"])
		) {
			wrapped = randomHug();
		} else {
			wrapped = randomPhrase();
		}

		const ctx = await responseContext(message, client);
		await unwrappingWith(ctx, wrapped, r => message.channel.send(r));
	}
}
