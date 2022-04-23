import type Discord from "discord.js";
import type { CommandContext } from "./commands/index.js";
import type { Logger } from "./logger.js";
import type { Storage } from "./configStorage.js";
import { invokeCommand } from "./actions/invokeCommand.js";
import { allCommands } from "./commands/index.js";
import { getEnv } from "./helpers/environment.js";
import { logUser } from "./helpers/logUser.js";
import { replyPrivately, sendMessageInChannel } from "./actions/messages/index.js";
import { richErrorMessage } from "./helpers/richErrorMessage.js";

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

		let channel: Discord.TextBasedChannels | null = null;
		if (interaction.channel?.isText() === true) {
			channel = interaction.channel;
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
				await interaction.deferReply({ ephemeral });
			},
			replyPrivately: async (options, viaDM: boolean = false) => {
				if (viaDM) {
					const content = ":paperclip: Check your DMs";
					if (interaction.deferred) {
						await interaction.editReply(content);
					} else {
						await interaction.reply({ content, ephemeral: true });
					}
				}
				if (interaction.deferred && !viaDM) {
					if (typeof options === "string") {
						await interaction.followUp({ ephemeral: true, content: options });
					} else {
						await interaction.followUp({ ephemeral: true, ...options });
					}
				} else {
					let reply: Discord.Message | boolean;
					if (typeof options === "string") {
						reply = await replyPrivately(interaction, { ephemeral: true, content: options }, viaDM);
					} else {
						reply = await replyPrivately(interaction, { ephemeral: true, ...options }, viaDM);
					}
					if (reply === false) {
						logger.info(`User ${logUser(interaction.user)} has DMs turned off.`);
					}
				}
			},
			reply: async options => {
				if (interaction.deferred) {
					try {
						await interaction.editReply(options);
					} catch (error) {
						logger.error(richErrorMessage("Failed to edit reply to interaction.", error));
						await interaction.followUp(options);
					}
				} else {
					if (typeof options === "string") {
						await interaction.reply(options);
					} else if (options.shouldMention === undefined || options.shouldMention) {
						await interaction.reply(options);
					} else {
						await interaction.reply({
							...options,
							allowedMentions: { users: [] }
						});
					}
				}

				if (typeof options !== "string" && "ephemeral" in options && options?.ephemeral === true) {
					logger.verbose(
						`Sent ephemeral reply to User ${logUser(interaction.user)}: ${JSON.stringify(options)}`
					);
				}
			},
			followUp: async options => {
				if (
					typeof options !== "string" &&
					options.reply === false &&
					interaction.channel &&
					interaction.channel.isText()
				) {
					return (await sendMessageInChannel(interaction.channel, options)) ?? false;
				}
				return (await interaction.followUp(options)) as Discord.Message;
			},
			deleteInvocation: () => Promise.resolve(undefined), // nop
			sendTyping: () => {
				void channel?.sendTyping();
				logger.debug(`Typing in channel ${channel?.id ?? "nowhere"} due to Context.sendTyping`);
			}
		};

		return invokeCommand(command, context);
	}
}
