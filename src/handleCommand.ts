import type { Storage } from "./configStorage";
import type { Logger } from "./logger";
import type { Command, CommandContext, MessageCommandInteractionOption } from "./commands";
import type Discord from "discord.js";
import { getEnv } from "./helpers/environment";
import { getConfigCommandPrefix } from "./actions/config/getConfigValue";
import { randomGreeting, randomPhrase, randomQuestion } from "./helpers/randomStrings";
import { allCommands as commands } from "./commands";
import { deleteMessage, reply, replyPrivately } from "./actions/messages";
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
  if (mentionedUserId !== null && mentionedUserId !== "") {
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

/**
 * Performs actions from a Discord message. The command is ignored if the message is from a bot or the message does
 * not begin with the configured command prefix.
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
  if (command?.execute) {
    const args = q.slice(1);
    const options: Array<MessageCommandInteractionOption> = [];

    // one argument
    const firstArg = args.shift();
    if (firstArg !== undefined) {
      let lastOption: MessageCommandInteractionOption = {
        name: firstArg,
        type: "STRING",
        value: firstArg,
        options: []
      };
      options.push(lastOption);
      while (args.length > 0) {
        // two arguments or more
        const name = args.shift() as string;
        const nextOption: MessageCommandInteractionOption = {
          name,
          type: "STRING",
          value: name,
          options: []
        };
        lastOption.options = [nextOption];
        lastOption = nextOption;
      }
    }

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
      prepareForLongRunningTasks: async (ephemeral?: boolean) => {
        await reply(message, "Let me think...", false);
        if (ephemeral === undefined || !ephemeral) {
          void message.channel.startTyping(30);
        }
      },
      replyPrivately: async (content: string) => {
        await replyPrivately(message, content);
        message.channel.stopTyping(true);
      },
      reply: async (content: string, options) => {
        await reply(message, content, options?.shouldMention);
        message.channel.stopTyping(true);
      },
      deleteInvocation: async () => {
        await deleteMessage(message);
      },
      startTyping: (count?: number) => void message.channel.startTyping(count),
      stopTyping: () => message.channel.stopTyping(true)
    };

    if (command.requiresGuild) {
      if (context.guild) {
        return command.execute({ ...context, guild: context.guild });
      }

      // No guild found
      return context.reply("Can't do that here.", { ephemeral: true });
    }

    // No guild required
    return command.execute(context);
  }

  if (!usedCommandPrefix) {
    // This is likely a game. Play along!
    void message.channel.startTyping();
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (q.map(s => s.toLowerCase()).includes("hello")) {
      await message.channel.send(randomGreeting());
    } else {
      await message.channel.send(randomPhrase());
    }
    message.channel.stopTyping(true);
  }
}
