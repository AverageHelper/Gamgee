import type { CommandInteractionOption } from "discord.js";
import type { Subcommand } from "../Command.js";
import type { SupportedLocale } from "../../i18n.js";
import { DEFAULT_LOCALE, t } from "../../i18n.js";
import { ApplicationCommandOptionType } from "discord.js";
import { assertUnreachable } from "../../helpers/assertUnreachable.js";
import { composed, createPartialString, push, pushBold } from "../../helpers/composeStrings.js";
import { durationString } from "../../helpers/durationString.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { getStoredQueueConfig, updateStoredQueueConfig } from "../../useQueueStorage.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import {
	resolveIntegerFromOption,
	resolveStringFromOption,
} from "../../helpers/optionResolvers.js";

type LimitKey =
	| "queue-duration"
	| "entry-duration-min"
	| "entry-duration-max"
	| "cooldown"
	| "count";

export interface QueueLimitArg {
	name: string;
	value: LimitKey;
	description: string;
	example: string;
}

function countLimitMeta(locale: SupportedLocale): QueueLimitArg {
	// TODO: Use nameLocalizations and descriptionLocalizations instead
	return {
		name: t("commands.limits.values.count.name", locale),
		value: "count",
		description: t("commands.limits.values.count.description", locale),
		example: "4",
	};
}

function cooldownLimitMeta(locale: SupportedLocale): QueueLimitArg {
	// TODO: Use nameLocalizations and descriptionLocalizations instead
	return {
		name: t("commands.limits.values.cooldown.name", locale),
		value: "cooldown",
		description: t("commands.limits.values.cooldown.description", locale),
		example: "1800",
	};
}

function minDurationLimitMeta(locale: SupportedLocale): QueueLimitArg {
	// TODO: Use nameLocalizations and descriptionLocalizations instead
	return {
		name: t("commands.limits.values.entry-duration-min.name", locale),
		value: "entry-duration-min",
		description: t("commands.limits.values.entry-duration-min.description", locale),
		example: "0",
	};
}

function maxDurationLimitMeta(locale: SupportedLocale): QueueLimitArg {
	// TODO: Use nameLocalizations and descriptionLocalizations instead
	return {
		name: t("commands.limits.values.entry-duration-max.name", locale),
		value: "entry-duration-max",
		description: t("commands.limits.values.entry-duration-max.description", locale),
		example: "430",
	};
}

function totalQueueLengthLimitMeta(locale: SupportedLocale): QueueLimitArg {
	// TODO: Use nameLocalizations and descriptionLocalizations instead
	return {
		name: t("commands.limits.values.queue-duration.name", locale),
		value: "queue-duration",
		description: t("commands.limits.values.queue-duration.description", locale),
		example: "10800",
	};
}

export function allLimits(locale: SupportedLocale): Array<QueueLimitArg> {
	return [
		countLimitMeta(locale),
		cooldownLimitMeta(locale),
		minDurationLimitMeta(locale),
		maxDurationLimitMeta(locale),
		totalQueueLengthLimitMeta(locale),
	];
}

const limitsList = allLimits(DEFAULT_LOCALE)
	.map(l => `\`${l.value}\``)
	.join(", ");

function isLimitKey(value: unknown): value is LimitKey {
	return (
		Boolean(value) &&
		typeof value === "string" &&
		allLimits(DEFAULT_LOCALE)
			.map(l => l.value)
			.includes(value as LimitKey)
	);
}

// TODO: I18N
export const limit: Subcommand = {
	name: "limit", // TODO: Alias this to "limits"
	description: "Set a limit value on the queue. (Time in seconds, where applicable)",
	options: [
		{
			name: "key",
			description: "The name of the limit.",
			type: ApplicationCommandOptionType.String,
			choices: allLimits(DEFAULT_LOCALE),
		},
		{
			name: "value",
			description: "The new value to set for the limit. Time values are given in seconds.",
			type: ApplicationCommandOptionType.Integer,
			minValue: -1,
		},
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const { guild, guildLocale, options, reply } = context;

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) return await reply(t("common.queue.not-set-up", guildLocale));

		const config = await getStoredQueueConfig(queueChannel);

		const keyOption: CommandInteractionOption | undefined = options[0];
		const valueOption: CommandInteractionOption | undefined = options[1];

		if (!keyOption) {
			const { limits } = await import("../limits.js");
			return await limits.execute(context);
		}

		const key: string = resolveStringFromOption(keyOption);

		if (!isLimitKey(key)) {
			const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
			return await reply(`I'm not sure what ${that} is. Try one of ${limitsList}`);
		}

		// Set limits on the queue
		switch (key) {
			case "entry-duration-max": {
				// ** Limit each entry's max duration
				if (!valueOption) {
					// Read the current limit
					const value = config.entryDurationMaxSeconds;
					if (value === null) {
						return await reply("There is no upper limit on entry duration.");
					}
					return await reply(
						`Upper entry duration limit is **${durationString(guildLocale, value)}**`,
					);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateStoredQueueConfig({ entryDurationMaxSeconds: value }, queueChannel);

				const response = createPartialString("Entry duration upper limit was ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(guildLocale, value), response);
				}
				return await reply(composed(response));
			}

			case "entry-duration-min": {
				// ** Limit each entry's min duration
				if (!valueOption) {
					// Read the current limit
					const value = config.entryDurationMinSeconds;
					if (value === null) {
						return await reply("There is no lower limit on entry duration.");
					}
					return await reply(
						`Entry duration lower limit is **${durationString(guildLocale, value)}**`,
					);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateStoredQueueConfig({ entryDurationMinSeconds: value }, queueChannel);

				const response = createPartialString("Entry duration lower limit was ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(guildLocale, value), response);
				}
				return await reply(composed(response));
			}

			case "queue-duration": {
				// ** Limit the total queue duration
				if (!valueOption) {
					// Read the current limit
					const value = config.queueDurationSeconds;
					if (value === null) {
						return await reply("There is no limit on the queue's total duration.");
					}
					return await reply(`Queue duration limit is **${durationString(guildLocale, value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateStoredQueueConfig({ queueDurationSeconds: value }, queueChannel);

				const response = createPartialString("Queue duration limit was ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(guildLocale, value), response);
				}
				return await reply(composed(response));
			}

			case "cooldown": {
				// ** Limit submission cooldown
				if (!valueOption) {
					// Read the current limit
					const value = config.cooldownSeconds;
					if (value === null) {
						return await reply("There is no submission cooldown time");
					}
					return await reply(`Submission cooldown is **${durationString(guildLocale, value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					value = config.cooldownSeconds;
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateStoredQueueConfig({ cooldownSeconds: value }, queueChannel);

				const response = createPartialString("Submission cooldown was ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(guildLocale, value), response);
				}
				return await reply(composed(response));
			}

			case "count": {
				// ** Limit submission count per user
				if (!valueOption) {
					// Read the current limit
					const value = config.submissionMaxQuantity;
					if (value === null) {
						return await reply("There is no limit on the number of submissions per user.");
					}
					return await reply(`Max submissions per user is **${value}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					value = config.submissionMaxQuantity;
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateStoredQueueConfig({ submissionMaxQuantity: value }, queueChannel);

				const response = createPartialString("Submission count limit per user was ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(`${value}`, response);
				}
				return await reply(composed(response));
			}

			default:
				assertUnreachable(key);
		}
	},
};
