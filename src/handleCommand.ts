import type { Command, CommandContext, MessageCommandInteractionOption } from "./commands/index.js";
import type { DMChannel, GuildTextBasedChannel, Message } from "discord.js";
import type { Logger } from "./logger.js";
import type { ReadonlyDeep } from "type-fest";
import type { Response, ResponseContext } from "./helpers/randomStrings.js";
import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { DEFAULT_LOCALE, localeIfSupported } from "./i18n.js";
import { getCommandPrefix } from "./useGuildStorage.js";
import { getEnv } from "./helpers/environment.js";
import { getUserIdFromMention } from "./helpers/getUserIdFromMention.js";
import { invokeCommand } from "./actions/invokeCommand.js";
import { logUser } from "./helpers/logUser.js";
import { resolveAlias, allCommands as commands } from "./commands/index.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "./constants/database.js";
import { timeoutSeconds } from "./helpers/timeoutSeconds.js";
import { assert, integer, max, min, number, size, string, StructError } from "superstruct";
import {
	deleteMessage,
	reply as _reply,
	replyPrivately as _replyPrivately,
	sendMessageInChannel
} from "./actions/messages/index.js";
import {
	randomGreeting,
	randomHug,
	randomPhrase,
	randomQuestion,
	unwrappingWith
} from "./helpers/randomStrings.js";

/**
 * The method that was used to invoke a command via a normal Discord message.
 *
 * Slash-commands and other interactions do not apply here, because those
 * interactions skip the message parser.
 *
 * A `"bot-mention"` invocation happens when the user mentions the bot user
 * directly. (e.g. "@bot help")
 *
 * A `"prefix"` invocation happens when the user prefixes their message with
 * the bot's configured command prefix. (e.g. "?help")
 *
 * A `"slash"` invocation happens when the user attempts to use a Discord
 * Slash Command, but Discord didn't catch that that's what the user was doing.
 * (e.g. "/help")
 */
type InvocationMethod = "bot-mention" | "prefix" | "slash";

interface QueryMessage {
	/** The command name and arguments. */
	query: Array<string>;

	/** The method the user used to invoke the command. */
	invocationMethod: InvocationMethod;
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
 * @param message The message to parse.
 * @param logger The place to write system messages.
 *
 * @returns The command query. The first argument is the command name, and the rest are arguments.
 */
export async function queryFromMessage(
	message: Message,
	logger: Logger
): Promise<QueryMessage | null> {
	const client = message.client;
	const content = message.content.trim();
	const query = content.split(/ +/u);

	const commandOrMention = query[0];
	if (commandOrMention === undefined || commandOrMention === "") return null;

	const mentionedUserId = getUserIdFromMention(commandOrMention);
	if (mentionedUserId !== null) {
		// See if it's for us.
		if (client.isReady() && mentionedUserId === client.user.id) {
			logger.debug("They're talking to me!");
			// It's for us. Return the query verbatim.
			return { query: query.slice(1), invocationMethod: "bot-mention" };
		}

		// It's not for me.
		logger.debug("They're not talking to me. Ignoring.");
		return null;
	}

	// See if it's an interaction-command intent
	if (content.startsWith(SLASH_COMMAND_INTENT_PREFIX)) {
		// get rid of the slash
		query[0] = query[0]?.slice(SLASH_COMMAND_INTENT_PREFIX.length) ?? "";
		query.forEach(s => s.trim());
		return { query, invocationMethod: "slash" };
	}

	// See if it's a message-command intent
	const commandPrefix = await getCommandPrefix(message.guild);
	if (content.startsWith(commandPrefix)) {
		// get rid of the prefix
		query[0] = query[0]?.slice(commandPrefix.length) ?? "";
		query.forEach(s => s.trim());
		return { query, invocationMethod: "prefix" };
	}

	// It's not for me.
	logger.debug("They're not talking to me. Ignoring.");
	return null;
}

/**
 * Translates an array of command argument strings into an array of
 * {@link MessageCommandInteractionOption} objects. Cross-references
 * option properties with those defined on the given `command`.
 *
 * Throws a {@link StructError} if the args don't match the constraints defined
 * for the command. Never throws if `command` is not provided.
 */
export function optionsFromArgs(
	args: Array<string>,
	command?: ReadonlyDeep<Command>
): [MessageCommandInteractionOption] | [] {
	const firstArg = args.shift();
	if (firstArg === undefined) return [];

	const first: MessageCommandInteractionOption = {
		name: firstArg,
		type: ApplicationCommandOptionType.String,
		value: firstArg,
		options: []
	};

	// assert the option type, return null if not match
	const firstOption = command?.options?.[0];
	if (firstOption) {
		const firstValue = first.value as string;
		switch (firstOption.type) {
			case ApplicationCommandOptionType.String:
				assert(
					firstValue,
					size(
						string(),
						firstOption.minLength ?? 0,
						firstOption.maxLength ?? Number.MAX_SAFE_INTEGER
					)
				);
				break;
			case ApplicationCommandOptionType.Integer: {
				let struct = integer();
				if (firstOption.minValue !== undefined) {
					struct = min(struct, firstOption.minValue);
				}
				if (firstOption.maxValue !== undefined) {
					struct = max(struct, firstOption.maxValue);
				}
				assert(firstValue, struct);
				first.type = firstOption.type;
				break;
			}
			case ApplicationCommandOptionType.Number: {
				let struct = number();
				if (firstOption.minValue !== undefined) {
					struct = min(struct, firstOption.minValue);
				}
				if (firstOption.maxValue !== undefined) {
					struct = max(struct, firstOption.maxValue);
				}
				assert(firstValue, struct);
				first.type = firstOption.type;
				break;
			}
			// TODO: Update `first` with the correct type, properly hydrated
		}
	}

	if (args.length === 0) return [first];

	first.type = ApplicationCommandOptionType.Subcommand;
	first.options = args.flat().map(value => {
		return {
			name: value,
			type: ApplicationCommandOptionType.String,
			value,
			options: []
		};
	});

	return [first];
}

/** Resolves guild member information for the bot and for the user who invoked the interaction. */
async function responseContext(message: Message): Promise<ResponseContext> {
	let me: string;
	const otherUser = message.author;
	const otherMember = (await message.guild?.members.fetch(otherUser)) ?? null;

	const client = message.client;
	if (client.isReady()) {
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
 * @param message The Discord message to handle.
 * @param logger The place to write system messages.
 */
export async function handleCommand(message: Message, logger: Logger): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		message.author.bot &&
		(message.author.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test-e2e")
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

	const parsedQuery = await queryFromMessage(message, logger);
	if (!parsedQuery) return; // Don't bother with normal chatter
	const { query, invocationMethod } = parsedQuery;

	if (query.length === 0) {
		// This is a query for us to handle (we might've been pinged), but it's empty.
		const ctx = await responseContext(message);
		return await unwrappingWith(ctx, randomQuestion(), r => _reply(message, r));
	}

	// Get the command
	const givenCommandName = query[0]?.toLowerCase() ?? "";
	if (!givenCommandName) return;

	const commandName = resolveAlias(givenCommandName);
	const command: Command | undefined = commands.get(commandName);

	if (invocationMethod === "slash") {
		// TODO: Educate the masses on Slash Commands
		// const commandPrefix = await getCommandPrefix(message.guild);
		// await message.reply(
		// 	`It seems like you tried a Slash Command (\`${SLASH_COMMAND_INTENT_PREFIX}${givenCommandName}\`), but Discord thought you were going for a normal message. If your text field doesn't show a command name above it as you type, Discord doesn't think you're writing a command.\n\nI'll take your message like an old-style command (\`${commandPrefix}${givenCommandName}\`) for now, but you might wanna practice your slasher skills for next time :P`
		// );
		return; // Comment this to continue handling the interaction even tho it's wrong
	}

	// Run the command
	if (command) {
		// Get args from the query. The first one is the command name, so we slice it off.
		let options: Array<MessageCommandInteractionOption>;

		// TODO: Let the user specify a userspace locale override outside of their Discord client preference. `/prefs` command maybe?

		const userLocale = localeIfSupported(message.guild?.preferredLocale) ?? DEFAULT_LOCALE;
		const guildLocale = localeIfSupported(message.guild?.preferredLocale) ?? DEFAULT_LOCALE;

		try {
			options = optionsFromArgs(query.slice(1), command);
		} catch (error) {
			if (error instanceof StructError) {
				await _replyPrivately(message, error.message, false, userLocale, guildLocale);
				return;
			}
			throw error;
		}

		logger.debug(
			`Calling command handler '${command.name}' with options ${JSON.stringify(
				options,
				undefined,
				2
			)}`
		);

		let channel: GuildTextBasedChannel | DMChannel;
		if (message.channel?.type === ChannelType.DM && message.channel.partial) {
			channel = await message.channel.fetch();
		} else {
			channel = message.channel;
		}

		const context: CommandContext = {
			type: "message",
			createdTimestamp: message.createdTimestamp,
			user: message.author,
			userLocale,
			userLocaleRaw: null,
			member: message.member,
			guild: message.guild,
			guildLocale,
			guildLocaleRaw: message.guild?.preferredLocale ?? null,
			channel,
			client: message.client,
			message,
			options,
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
				const reply = await _replyPrivately(message, options, true, userLocale, guildLocale);
				if (reply === null) {
					logger.info(`User ${logUser(message.author)} has DMs turned off.`);
				}
			},
			reply: async options => {
				if (typeof options === "string" || !("shouldMention" in options)) {
					await _reply(message, options);
				} else {
					await _reply(message, options, options?.shouldMention);
				}
			},
			followUp: async options => {
				if (typeof options !== "string" && "ephemeral" in options && options.ephemeral === true) {
					return await _replyPrivately(message, options, true, userLocale, guildLocale);
				}
				if (typeof options === "string") {
					return (await sendMessageInChannel(message.channel, options)) ?? false;
				}
				return (
					(await sendMessageInChannel(message.channel, { ...options, reply: undefined })) ?? false
				);
			},
			deleteInvocation: async () => {
				await deleteMessage(message);
			},
			sendTyping: () => {
				void message.channel.sendTyping();
				logger.debug(`Started typing in channel ${message.channel.id} due to Context.sendTyping`);
			}
		};

		return await invokeCommand(command, context);
	}

	// Some helpers for parsing intents
	const messageContainsWord = (str: string): boolean =>
		query.map(s => s.toLowerCase()).includes(str);
	const messageContainsOneOfWords = (strs: ReadonlyArray<string>): boolean =>
		query.map(s => s.toLowerCase()).some(s => strs.includes(s));

	if (invocationMethod === "bot-mention") {
		// This is likely a game. Play along!
		void message.channel.sendTyping();
		logger.debug(
			`Started typing in channel ${message.channel.id} due to handleCommand receiving a game`
		);
		await timeoutSeconds(2);

		let wrapped: Response;

		if (messageContainsWord("hello")) {
			wrapped = randomGreeting();
		} else if (
			messageContainsOneOfWords([
				"hug",
				"hug?",
				"hug!",
				"hugs",
				"hugs?",
				"hugs!",
				"*hugs",
				"hugs*",
				"*hugs*",
				"hugs,",
				"hug"
			])
		) {
			wrapped = randomHug();
		} else {
			wrapped = randomPhrase();
		}

		const ctx = await responseContext(message);
		await unwrappingWith(ctx, wrapped, r => message.channel.send(r));
	}
}
