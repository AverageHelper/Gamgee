import type { CommandInteractionOption } from "discord.js";
import type { Subcommand } from "../Command.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { useQueue } from "../../actions/queue/useQueue.js";
import durationString from "../../helpers/durationString.js";
import getQueueChannel from "../../actions/queue/getQueueChannel.js";
import { composed, createPartialString, push, pushBold } from "../../helpers/composeStrings.js";
import { getQueueConfig } from "../../useQueueStorage.js";
import {
	resolveIntegerFromOption,
	resolveStringFromOption
} from "../../helpers/optionResolvers.js";

type LimitKey = "entry-duration" | "cooldown" | "count";

export interface QueueLimitArg {
	name: string;
	value: LimitKey;
	description: string;
}

export const allLimits: Array<QueueLimitArg> = [
	{
		name: "Song Length",
		value: "entry-duration",
		description: "The maximum duration of a song submission."
	},
	{
		name: "Submission Cooldown",
		value: "cooldown",
		description:
			"The minimum amount of time that each user must wait between their own submissions."
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

const limit: Subcommand = {
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

		const queue = useQueue(queueChannel);
		const config = await getQueueConfig(queueChannel);

		const keyOption: CommandInteractionOption | undefined = options.data[0];
		const valueOption: CommandInteractionOption | undefined = options.data[1];

		if (!keyOption) {
			const { default: limits } = await import("../limits");
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
				// Limit each duration entry
				if (!valueOption) {
					// Read the current limit
					const value = config.entryDurationSeconds;
					if (value === null) {
						return reply(`There is no limit on entry duration.`);
					}
					return reply(`Entry duration limit is **${durationString(value)}**`);
				}

				// Set a new limit
				let value = resolveIntegerFromOption(valueOption);
				if (value !== null && Number.isNaN(value)) {
					return reply("That doesn't look like an integer. Enter a number value in seconds.");
				}
				value = value === null || value <= 0 ? null : value;
				await queue.updateConfig({ entryDurationSeconds: value });

				const response = createPartialString("Entry duration limit ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(durationString(value), response);
				}
				return reply(composed(response));
			}

			case "cooldown": {
				// Limit submission cooldown
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
				await queue.updateConfig({ cooldownSeconds: value });

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
				// Limit submission count per user
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
				await queue.updateConfig({ submissionMaxQuantity: value });

				const response = createPartialString("Submission count limit per user ");
				if (value === null || value <= 0) {
					pushBold("removed", response);
				} else {
					push("set to ", response);
					pushBold(`${value}`, response);
				}
				return reply(composed(response));
			}
		}
	}
};

export default limit;
