import type { Command } from "./Command.js";
import { allLimits } from "./queue/limit.js";
import { assertUnreachable } from "../helpers/assertUnreachable.js";
import { code } from "../helpers/composeStrings.js";
import { durationString } from "../helpers/durationString.js";
import { EmbedBuilder } from "discord.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { getStoredQueueConfig } from "../useQueueStorage.js";
import { localizations, t, ti } from "../i18n.js";

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
		const cooldownName: string = cooldownCommand.nameLocalizations
			? cooldownCommand.nameLocalizations[locale] ?? cooldownCommand.name
			: cooldownCommand.name;

		// Read out the existing limits
		const embed = new EmbedBuilder()
			.setTitle(t("commands.limits.responses.title", locale))
			.setDescription(
				ti(
					"commands.limits.responses.use-cooldown-cmd",
					{ cooldown: code(`/${cooldownName}`) },
					locale
				)
			);

		allLimits(locale).forEach(key => {
			let value: string;
			switch (key.value) {
				case "cooldown":
					if (config.cooldownSeconds !== null && config.cooldownSeconds > 0) {
						value = durationString(locale, config.cooldownSeconds);
					} else {
						value = t("commands.limits.responses.none", locale);
					}
					break;
				case "entry-duration-max":
					if (config.entryDurationMaxSeconds !== null && config.entryDurationMaxSeconds > 0) {
						value = durationString(locale, config.entryDurationMaxSeconds);
					} else {
						value = t("commands.limits.responses.infinite", locale);
					}
					break;
				case "entry-duration-min":
					if (config.entryDurationMinSeconds !== null && config.entryDurationMinSeconds > 0) {
						value = durationString(locale, config.entryDurationMinSeconds);
					} else {
						value = "0";
					}
					break;
				case "queue-duration":
					if (config.queueDurationSeconds !== null && config.queueDurationSeconds > 0) {
						value = durationString(locale, config.queueDurationSeconds);
					} else {
						value = t("commands.limits.responses.infinite", locale);
					}
					break;
				case "count":
					if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
						value = `${config.submissionMaxQuantity}`;
					} else {
						value = t("commands.limits.responses.infinite", locale);
					}
					break;
				default:
					assertUnreachable(key.value);
			}

			embed.addFields({ name: `${key.name}:\t${value}`, value: key.description });
		});

		await reply({ embeds: [embed], ephemeral: true });
	}
};
