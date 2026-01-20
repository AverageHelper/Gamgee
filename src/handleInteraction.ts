import type { CommandContext } from "./commands/index.js";
import type {
	ChatInputCommandInteraction,
	DMChannel,
	GuildMember,
	GuildTextBasedChannel,
} from "discord.js";
import type { Logger } from "./logger.js";
import { allCommands } from "./commands/index.js";
import { ChannelType } from "discord.js";
import { DEFAULT_LOCALE, localeIfSupported } from "./i18n.js";
import { getEnv } from "./helpers/environment.js";
import { invokeCommand } from "./actions/invokeCommand.js";
import { logUser } from "./helpers/logUser.js";
import { replyPrivately, sendMessageInChannel } from "./actions/messages/index.js";
import { richErrorMessage } from "./helpers/richErrorMessage.js";

/**
 * Performs actions from a Discord command interaction.
 * The command is ignored if the interaction is from a bot.
 *
 * @param interaction The Discord interaction to handle.
 * @param logger The place to write system messages.
 */
export async function handleInteraction(
	interaction: ChatInputCommandInteraction,
	logger: Logger,
): Promise<void> {
	// Don't respond to bots unless we're being tested
	if (
		interaction.user.bot &&
		(interaction.user.id !== getEnv("CORDE_BOT_ID") || getEnv("NODE_ENV") !== "test-e2e")
	) {
		logger.silly("Momma always said not to talk to strangers. They could be *bots* ");
		return;
	}

	// Ignore self interactions
	if (interaction.user.id === interaction.client.user?.id) return;

	logger.debug(`User ${logUser(interaction.user)} sent command: '${interaction.commandName}'`);

	const command = allCommands.get(interaction.commandName);
	if (command?.execute) {
		logger.debug(
			`Calling command handler '${command.name}' with options ${JSON.stringify(
				interaction.options,
				undefined,
				2,
			)}`,
		);

		const member: GuildMember | null = interaction.inCachedGuild()
			? interaction.member
			: ((await interaction.guild?.members.fetch(interaction.user)) ?? null);

		const channel: GuildTextBasedChannel | DMChannel | null =
			interaction.channel?.type === ChannelType.DM && interaction.channel.partial
				? await interaction.channel.fetch()
				: interaction.channel;

		// TODO: Let the user specify a userspace locale override outside of their Discord client preference. `/prefs` command maybe?

		const userLocale = localeIfSupported(interaction.locale) ?? DEFAULT_LOCALE;
		const guildLocale = localeIfSupported(interaction.guildLocale) ?? DEFAULT_LOCALE;

		const context: CommandContext = {
			type: "interaction",
			createdTimestamp: interaction.createdTimestamp,
			user: interaction.user,
			userLocale,
			userLocaleRaw: interaction.locale,
			member,
			guild: interaction.guild,
			guildLocale,
			guildLocaleRaw: interaction.guildLocale,
			channel,
			client: interaction.client,
			interaction,
			options: interaction.options.data,
			logger,
			prepareForLongRunningTasks: async (ephemeral?: boolean) => {
				try {
					await interaction.deferReply({ ephemeral });
				} catch (error) {
					logger.error(richErrorMessage("Failed to defer reply to interaction.", error));
				}
			},
			replyPrivately: async (options, viaDM: boolean = false) => {
				if (viaDM) {
					const content = ":paperclip: Check your DMs";
					if (interaction.deferred) {
						try {
							await interaction.editReply(content);
						} catch (error) {
							logger.error(richErrorMessage("Failed to edit reply to interaction.", error));
						}
					} else {
						try {
							await interaction.reply({ content, ephemeral: true });
						} catch (error) {
							logger.error(richErrorMessage("Failed to reply to interaction.", error));
						}
					}
				}
				if (interaction.deferred && !viaDM) {
					try {
						await (typeof options === "string"
							? interaction.followUp({ ephemeral: true, content: options })
							: interaction.followUp({ ...options, ephemeral: true }));
					} catch (error) {
						logger.error(richErrorMessage("Failed to follow up on interaction.", error));
					}
				} else {
					const reply = await replyPrivately(interaction, options, viaDM, userLocale, guildLocale);
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
					try {
						if (typeof options === "string") {
							await interaction.reply(options);
						} else if (
							!("shouldMention" in options) ||
							options.shouldMention === undefined ||
							options.shouldMention
						) {
							// Doesn't say whether to mention, default to `true`
							await interaction.reply(options);
						} else {
							// Really shouldn't mention
							await interaction.reply({
								...options,
								allowedMentions: { users: [] },
							});
						}
					} catch (error) {
						logger.error(richErrorMessage("Failed to reply to interaction.", error));
					}
				}

				if (typeof options !== "string" && "ephemeral" in options && options?.ephemeral === true) {
					// FIXME: Not true if we errored out
					logger.verbose(
						`Sent ephemeral reply to User ${logUser(interaction.user)}: ${JSON.stringify(options)}`,
					);
				}
			},
			followUp: async options => {
				if (
					typeof options !== "string" &&
					(!("reply" in options) || options.reply === false || options.reply === undefined) &&
					interaction.channel?.isTextBased()
				) {
					return (
						(await sendMessageInChannel(interaction.channel, { ...options, reply: undefined })) ??
						false
					);
				}
				try {
					return await interaction.followUp(options);
				} catch (error) {
					logger.error(richErrorMessage("Failed to follow up on interaction.", error));
					return false;
				}
			},
			deleteInvocation: () => Promise.resolve(undefined), // nop
			sendTyping: () => {
				void interaction.channel?.sendTyping();
				logger.debug(
					`Typing in channel ${interaction.channel?.id ?? "nowhere"} due to Context.sendTyping`,
				);
			},
		};

		return await invokeCommand(command, context);
	}
}
