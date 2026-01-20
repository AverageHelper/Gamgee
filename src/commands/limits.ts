import type { Command } from "./Command.js";
import { allLimits } from "./queue/limit.js";
import { assertUnreachable } from "../helpers/assertUnreachable.js";
import { durationString } from "../helpers/durationString.js";
import { EmbedBuilder } from "discord.js";
import { getCommandPrefix } from "../useGuildStorage.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { getStoredQueueConfig } from "../useQueueStorage.js";
import { localizations, t, ti } from "../i18n.js";
import { mentionCommand } from "../helpers/mentionCommands.js";

export const limits: Command = {
	name: "limits",
	nameLocalizations: localizations("commands.limits.name"),
	description: "Display the song queue's submission limits.",
	descriptionLocalizations: localizations("commands.limits.description"),
	requiresGuild: true,
	async execute({ type, guild, guildLocale, userLocale, reply }) {
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return await reply(t("common.queue.not-set-up", guildLocale));
		}

		const config = await getStoredQueueConfig(queueChannel);

		// We call `reply` with `ephemeral: true`, which has different behavior between
		// slash-command interactions and message commands.
		const locale = type === "interaction" ? userLocale : guildLocale;

		const { cooldown: cooldownCommand } = await import("./cooldown.js");
		const COMMAND_PREFIX = await getCommandPrefix(guild);

		// Read out the existing limits
		const embed = new EmbedBuilder()
			.setTitle(t("commands.limits.responses.title", locale))
			.setDescription(
				ti(
					"commands.limits.responses.use-cooldown-cmd",
					{ cooldown: mentionCommand(cooldownCommand, guild, COMMAND_PREFIX) },
					locale,
				),
			);

		for (const key of allLimits(locale)) {
			let value: string;
			switch (key.value) {
				case "cooldown":
					value =
						config.cooldownSeconds !== null && config.cooldownSeconds > 0
							? durationString(locale, config.cooldownSeconds)
							: t("commands.limits.responses.none", locale);
					break;
				case "entry-duration-max":
					value =
						config.entryDurationMaxSeconds !== null && config.entryDurationMaxSeconds > 0
							? durationString(locale, config.entryDurationMaxSeconds)
							: t("commands.limits.responses.infinite", locale);
					break;
				case "entry-duration-min":
					value =
						config.entryDurationMinSeconds !== null && config.entryDurationMinSeconds > 0
							? durationString(locale, config.entryDurationMinSeconds)
							: "0";
					break;
				case "queue-duration":
					value =
						config.queueDurationSeconds !== null && config.queueDurationSeconds > 0
							? durationString(locale, config.queueDurationSeconds)
							: t("commands.limits.responses.infinite", locale);
					break;
				case "count":
					value =
						config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0
							? `${config.submissionMaxQuantity}`
							: t("commands.limits.responses.infinite", locale);
					break;
				default:
					assertUnreachable(key.value);
			}

			embed.addFields({ name: `${key.name}:\t${value}`, value: key.description });
		}

		await reply({ embeds: [embed], ephemeral: true });
	},
};
