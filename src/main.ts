import "source-map-support/register";
import "reflect-metadata";
import { getEnv, requireEnv } from "./helpers/environment";
import { useLogger } from "./logger";
import { version as gamgeeVersion } from "./version";
import type { Command } from "./commands";
import * as commandDefinitions from "./commands";

const logger = useLogger();
logger.verbose("*Yawn* Good morning!");
logger.verbose("Starting...");
logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);
logger.info(`Started Gamgee Core v${gamgeeVersion}`);

import Discord from "discord.js";
import richErrorMessage from "./helpers/richErrorMessage";
import logUser from "./helpers/logUser";
import { useStorage } from "./configStorage";
import { handleCommand } from "./handleCommand";
import { handleReactionAdd } from "./handleReactionAdd";
import { replyPrivately } from "./actions/messages";

const commands = new Discord.Collection<string, Command>();
Object.values(commandDefinitions).forEach(command => {
  commands.set(command.name, command);
});

async function onInteraction(
  client: Discord.Client,
  interaction: Discord.Interaction
): Promise<void> {
  if (!interaction.isCommand()) return;

  // Don't respond to bots unless we're being tested
  if (
    interaction.user.bot &&
    (interaction.user.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test")
  ) {
    logger.silly("Momma always said not to talk to strangers. They could be *bots* ");
    return;
  }

  // Ignore self interactions
  if (interaction.user.id === client.user?.id) return;

  logger.debug(`User ${logUser(interaction.user)} sent command: '${interaction.commandName}'`);

  const command = commands.get(interaction.commandName);
  if (command?.execute) {
    const storage = await useStorage(interaction.guild, logger);
    // logger.debug(
    //   `Handling interaction '${interaction.commandName}' with args [${interaction.options
    //     .map(opt => `${opt.name} (${opt.type.toString()}): ${opt.value?.toString() ?? "undefined"}`)
    //     .join(", ")}]`
    // );
    // logger.debug(`Handling interaction: ${JSON.stringify(interaction, undefined, 2)}`);
    logger.debug(
      `Calling command handler '${command.name}' with options ${JSON.stringify(
        interaction.options,
        undefined,
        2
      )}`
    );

    let channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel | null = null;
    if (interaction.channel?.isText() === true) {
      channel = interaction.channel as
        | Discord.TextChannel
        | Discord.DMChannel
        | Discord.NewsChannel;
    }

    await command.execute({
      type: "interaction",
      createdTimestamp: interaction.createdTimestamp,
      user: interaction.user,
      guild: interaction.guild,
      channel,
      client,
      interaction,
      options: interaction.options,
      storage,
      logger,
      prepareForLongRunningTasks: async (ephemeral?: boolean) => {
        await interaction.defer(ephemeral);
      },
      replyPrivately: async (content: string) => {
        await replyPrivately(interaction, content);
      },
      reply: async (content: string, options) => {
        if (interaction.deferred) {
          await interaction.editReply(content);
        } else {
          if (!options || options.shouldMention === undefined || options.shouldMention) {
            await interaction.reply(content, { ephemeral: options?.ephemeral });
          } else {
            await interaction.reply(content, {
              ephemeral: options?.ephemeral,
              allowedMentions: { users: [] }
            });
          }
        }
      },
      deleteInvocation: () => Promise.resolve(undefined),
      startTyping: (count?: number) => void channel?.startTyping(count),
      stopTyping: () => void channel?.stopTyping(true)
    });
  }
}

async function onNewMessage(
  client: Discord.Client,
  msg: Discord.Message | Discord.PartialMessage
): Promise<void> {
  try {
    const message = await msg.fetch();
    const storage = await useStorage(message.guild, logger);
    await handleCommand(client, message, storage, logger);
  } catch (error: unknown) {
    const msgDescription = JSON.stringify(msg, undefined, 2);
    logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
  }
}

async function onMessageReactionAdd(
  rxn: Discord.MessageReaction,
  usr: Discord.User | Discord.PartialUser
): Promise<void> {
  try {
    const [reaction, user] = await Promise.all([rxn.fetch(), usr.fetch()]);
    await handleReactionAdd(reaction, user, logger);
  } catch (error: unknown) {
    logger.error(richErrorMessage("Failed to handle reaction add.", error));
  }
}

async function prepareCommands(client: Discord.Client): Promise<void> {
  const testGuild = await client.guilds.fetch("820897928654356512");

  await testGuild.commands.set(Object.values(commandDefinitions)); // set test guild commands
  await client.application?.commands.set([]); // set global commands
}

try {
  const client = new Discord.Client({
    intents: [
      "GUILDS",
      "GUILD_MESSAGES",
      "GUILD_MESSAGE_REACTIONS",
      "DIRECT_MESSAGES",
      "GUILD_MESSAGE_TYPING"
    ],
    partials: ["REACTION", "CHANNEL", "MESSAGE"]
  });

  // Handle client events
  client.on("ready", () => {
    logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}`);

    void prepareCommands(client);
  });

  client.on("error", error => {
    logger.error(richErrorMessage("Received client error.", error));
  });

  client.on("message", msg => {
    void onNewMessage(client, msg);
  });

  client.on("interaction", interaction => {
    void onInteraction(client, interaction);
  });

  client.on("messageReactionAdd", (reaction, user) => {
    void onMessageReactionAdd(reaction, user);
  });

  // Log in
  void client.login(requireEnv("DISCORD_TOKEN"));

  // Handle top-level errors
} catch (error: unknown) {
  logger.error(richErrorMessage("Something bad has happened and we had to stop a command.", error));
}
