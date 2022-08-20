import type { CommandInteractionOption } from "discord.js";
// import type { QueueConfig } from "../../database/model/QueueConfig.js";
import type { Subcommand } from "../Command.js";
import { assertUnreachable } from "../../helpers/assertUnreachable.js";
import { composed, createPartialString, push, pushBold } from "../../helpers/composeStrings.js";
import { durationString } from "../../helpers/durationString.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { getQueueConfig, updateQueueConfig } from "../../useQueueStorage.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { t } from "../../i18n.js";
import {
	// ActionRowBuilder,
	ApplicationCommandOptionType
	// ModalBuilder,
	// TextInputBuilder,
	// TextInputStyle
} from "discord.js";
import {
	resolveIntegerFromOption,
	resolveStringFromOption
} from "../../helpers/optionResolvers.js";

type LimitKey = "queue-duration" | "entry-duration" | "entry-duration-min" | "cooldown" | "count";

export interface QueueLimitArg {
	name: string;
	value: LimitKey;
	description: string;
	example: string;
}

// function queueLimitValueForMeta(config: QueueConfig, meta: QueueLimitArg): number | null {
// 	switch (meta.value) {
// 		case "cooldown":
// 			return config.cooldownSeconds;
// 		case "count":
// 			return config.submissionMaxQuantity;
// 		case "entry-duration":
// 			return config.entryDurationSeconds;
// 		case "entry-duration-min":
// 			return config.entryDurationMinSeconds;
// 		case "queue-duration":
// 			return config.queueDurationSeconds;
// 	}
// }

// TODO: i18n
export const countLimitMeta: QueueLimitArg = {
	name: "Number of Submissions",
	value: "count",
	description: "The maximum number of submissions that each user may submit.",
	example: "4"
};

export const cooldownLimitMeta: QueueLimitArg = {
	name: "Submission Cooldown",
	value: "cooldown",
	description:
		"The minimum amount of time (in seconds) that each user must wait between their own submissions.",
	example: "1800"
};

export const minDurationLimitMeta: QueueLimitArg = {
	name: "Min Song Length",
	value: "entry-duration-min",
	description: "The minimum duration (in seconds) of a song submission.",
	example: "0"
};

export const maxDurationLimitMeta: QueueLimitArg = {
	name: "Max Song Length",
	value: "entry-duration", // TODO: Rename this to something more sane
	description: "The maximum duration (in seconds) of a song submission.",
	example: "430"
};

export const totalQueueLengthLimitMeta: QueueLimitArg = {
	name: "Total Queue Length",
	value: "queue-duration",
	description:
		"The maximum duration (in seconds) that the queue should take if all its entries were played end-to-end. The queue will automatically close when a submission takes the queue over this limit.",
	example: "10800"
};

export const allLimits: Array<QueueLimitArg> = [
	countLimitMeta,
	cooldownLimitMeta,
	minDurationLimitMeta,
	maxDurationLimitMeta,
	totalQueueLengthLimitMeta
];

const limitsList = allLimits.map(l => `\`${l.value}\``).join(", ");

function isLimitKey(value: unknown): value is LimitKey {
	return (
		Boolean(value) &&
		typeof value === "string" &&
		allLimits.map(l => l.value).includes(value as LimitKey)
	);
}

/** @see https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals */
// const MAX_INPUT_FIELDS_IN_MODAL = 5;

export const limit: Subcommand = {
	name: "limit", // TODO: Alias this to "limits"
	description: "Set a limit value on the queue. (Time in seconds, where applicable)",
	options: [
		{
			name: "key",
			description: "The name of the limit.",
			type: ApplicationCommandOptionType.String,
			choices: allLimits
		},
		{
			name: "value",
			description: "The new value to set for the key.",
			type: ApplicationCommandOptionType.Integer,
			minValue: -1
		}
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const { /* type,*/ guild, guildLocale, options, reply } = context;

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) return await reply(t("common.queue.not-set-up", guildLocale));

		const config = await getQueueConfig(queueChannel);

		// TODO: Handle modal interaction
		// if (type === "interaction" && allLimits.length < MAX_INPUT_FIELDS_IN_MODAL) {
		// 	const modal = new ModalBuilder() //
		// 		.setCustomId("queue-limit-config")
		// 		.setTitle("Queue Limits");

		// 	allLimits.forEach(meta => {
		// 		const value = queueLimitValueForMeta(config, meta);
		// 		const input = new TextInputBuilder()
		// 			.setCustomId(meta.value)
		// 			.setLabel(meta.name)
		// 			.setPlaceholder(`e.g.: ${meta.example}`)
		// 			.setValue(`${value ?? ""}`)
		// 			.setStyle(TextInputStyle.Short)
		// 			.setRequired(false)
		// 			.setMinLength(1)
		// 			.setMaxLength(17); // <= 1 tril w/o commas, <= 10 quad w/ commas; should be enough
		// 		const row = new ActionRowBuilder<TextInputBuilder>() //
		// 			.addComponents(input);
		// 		modal.addComponents(row);
		// 	});

		// 	return await context.interaction.showModal(modal);
		// }

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
			case "entry-duration": {
				// ** Limit each entry's max duration
				if (!valueOption) {
					// Read the current limit
					const value = config.entryDurationSeconds;
					if (value === null) {
						return await reply("There is no upper limit on entry duration.");
					}
					return await reply(
						`Upper entry duration limit is **${durationString(guildLocale, value)}**`
					);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ entryDurationSeconds: value }, queueChannel);

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
						`Entry duration lower limit is **${durationString(guildLocale, value)}**`
					);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return await reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ entryDurationMinSeconds: value }, queueChannel);

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
				await updateQueueConfig({ queueDurationSeconds: value }, queueChannel);

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
				await updateQueueConfig({ cooldownSeconds: value }, queueChannel);

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
				await updateQueueConfig({ submissionMaxQuantity: value }, queueChannel);

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
	}
};
