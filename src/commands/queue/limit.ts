import type { CommandInteractionOption } from "discord.js";
import type { Subcommand } from "../Command.js";
import { assertUnreachable } from "../../helpers/assertUnreachable.js";
import { composed, createPartialString, push, pushBold } from "../../helpers/composeStrings.js";
import { durationString } from "../../helpers/durationString.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { getQueueConfig, updateQueueConfig } from "../../useQueueStorage.js";
import {
	resolveIntegerFromOption,
	resolveStringFromOption
} from "../../helpers/optionResolvers.js";

type LimitKey = "queue-duration" | "entry-duration" | "cooldown" | "count";

export interface QueueLimitArg {
	name: string;
	value: LimitKey;
	description: string;
}

export const allLimits: Array<QueueLimitArg> = [
	{
		name: "Total Queue Length",
		value: "queue-duration",
		description:
			"The maximum duration (in seconds) that the queue should take if all its entries were played end-to-end. The queue will automatically close when a submission takes the queue over this limit."
	},
	{
		name: "Song Length",
		value: "entry-duration",
		description: "The maximum duration (in seconds) of a song submission."
	},
	{
		name: "Submission Cooldown",
		value: "cooldown",
		description:
			"The minimum amount of time (in seconds) that each user must wait between their own submissions."
	},
	{
		name: "Number of Submissions",
		value: "count",
		description: "The maximum number of submissions that each user may submit."
	}
];

const limitsList = allLimits.map(l => `\`${l.value}\``).join(", ");

function isLimitKey(value: unknown): value is LimitKey {
	return (
		Boolean(value) &&
		typeof value === "string" &&
		allLimits.map(l => l.value).includes(value as LimitKey)
	);
}

export const limit: Subcommand = {
	name: "limit", // TODO: Alias this to "limits"
	description: "Set a limit value on the queue. (Time in seconds, where applicable)",
	options: [
		{
			name: "key",
			description: "The name of the limit.",
			type: "STRING",
			required: true,
			choices: allLimits
		},
		{
			name: "value",
			description: "The new value to set for the key.",
			type: "INTEGER"
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const { guild, options, reply } = context;
		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return reply("No queue is set up.");
		}

		const config = await getQueueConfig(queueChannel);

		const keyOption: CommandInteractionOption | undefined = options.data[0];
		const valueOption: CommandInteractionOption | undefined = options.data[1];

		if (!keyOption) {
			const { limits } = await import("../limits.js");
			return limits.execute(context);
		}

		const key: string = resolveStringFromOption(keyOption);

		if (!isLimitKey(key)) {
			const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
			return reply(`I'm not sure what ${that} is. Try one of ${limitsList}`);
		}

		// Set limits on the queue
		switch (key) {
			case "entry-duration": {
				// ** Limit each entry's duration
				if (!valueOption) {
					// Read the current limit
					const value = config.entryDurationSeconds;
					if (value === null) {
						return reply("There is no limit on entry duration.");
					}
					return reply(`Entry duration limit is **${durationString(value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ entryDurationSeconds: value }, queueChannel);

				const response = createPartialString("Entry duration limit ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(value), response);
				}
				return reply(composed(response));
			}

			case "queue-duration": {
				// ** Limit the total queue duration
				if (!valueOption) {
					// Read the current limit
					const value = config.queueDurationSeconds;
					if (value === null) {
						return reply("There is no limit on the queue's total duration.");
					}
					return reply(`Queue duration limit is **${durationString(value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ queueDurationSeconds: value }, queueChannel);

				const response = createPartialString("Queue duration limit ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(value), response);
				}
				return reply(composed(response));
			}

			case "cooldown": {
				// ** Limit submission cooldown
				if (!valueOption) {
					// Read the current limit
					const value = config.cooldownSeconds;
					if (value === null) {
						return reply("There is no submission cooldown time");
					}
					return reply(`Submission cooldown is **${durationString(value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					value = config.cooldownSeconds;
					return reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ cooldownSeconds: value }, queueChannel);

				const response = createPartialString("Submission cooldown ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(value), response);
				}
				return reply(composed(response));
			}

			case "count": {
				// ** Limit submission count per user
				if (!valueOption) {
					// Read the current limit
					const value = config.submissionMaxQuantity;
					if (value === null) {
						return reply("There is no limit on the number of submissions per user.");
					}
					return reply(`Max submissions per user is **${value}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					value = config.submissionMaxQuantity;
					return reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await updateQueueConfig({ submissionMaxQuantity: value }, queueChannel);

				const response = createPartialString("Submission count limit per user ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(`${value}`, response);
				}
				return reply(composed(response));
			}

			default:
				assertUnreachable(key);
		}
	}
};
