import type Discord from "discord.js";
import type { CommandContext } from "./commands";
import type { Logger } from "./logger";
import type { Storage } from "./configStorage";
import { invokeCommand } from "./actions/invokeCommand";
import { allCommands } from "./commands";
import { getEnv } from "./helpers/environment";
import { replyPrivately, sendMessageInChannel } from "./actions/messages";
import logUser from "./helpers/logUser";

/**
 * Performs actions from a Discord command interaction.
 * The command is ignored if the interaction is from a bot.
 *
 * @param client The Discord client.
 * @param message The Discord message to handle.
 * @param storage Arbitrary persistent storage.
 */
export async function handleInteraction(
  client: Discord.Client,
  interaction: Discord.CommandInteraction,
  storage: Storage | null,
  logger: Logger
): Promise<void> {
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

  const command = allCommands.get(interaction.commandName);
  if (command?.execute) {
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

    const context: CommandContext = {
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
      replyPrivately: async (content: string, viaDM: boolean = false) => {
        if (viaDM) {
          const prompt = ":paperclip: Check your DMs";
          if (interaction.deferred) {
            await interaction.editReply(prompt);
          } else {
            await interaction.reply(prompt, { ephemeral: true });
          }
        }
        if (interaction.deferred && !viaDM) {
          await interaction.followUp(content);
        } else {
          const didReply = await replyPrivately(interaction, content, viaDM);
          if (!didReply) {
            logger.info(`User ${logUser(interaction.user)} has DMs turned off.`);
          }
        }
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

        if (options?.ephemeral === true) {
          logger.verbose(`Sent ephemeral reply to User ${logUser(interaction.user)}: ${content}`);
        }
      },
      followUp: async (content: string, options) => {
        if (options?.reply === false && interaction.channel && interaction.channel.isText()) {
          await sendMessageInChannel(interaction.channel, content);
        } else {
          await interaction.followUp(content, options);
        }
      },
      deleteInvocation: () => Promise.resolve(undefined),
      startTyping: (count?: number) => void channel?.startTyping(count),
      stopTyping: () => void channel?.stopTyping(true)
    };

    return invokeCommand(command, context);
  }
}
