import type { CommandInteractionOption } from "discord.js";
import type { Subcommand } from "../Command";
import { resolveIntegerFromOption, resolveStringFromOption } from "../../helpers/optionResolvers";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { useQueue } from "../../actions/queue/useQueue";
import durationString from "../../helpers/durationString";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import StringBuilder from "../../helpers/StringBuilder";

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
	name: "limit",
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
		const config = await queue.getConfig();

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

				const responseBuilder = new StringBuilder("Entry duration limit ");
				if (value === null || value <= 0) {
					responseBuilder.pushBold("removed");
				} else {
					responseBuilder.push("set to ");
					responseBuilder.pushBold(durationString(value));
				}
				return reply(responseBuilder.result());
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

				const responseBuilder = new StringBuilder("Submission cooldown ");
				if (value === null || value <= 0) {
					responseBuilder.pushBold("removed");
				} else {
					responseBuilder.push("set to ");
					responseBuilder.pushBold(durationString(value));
				}
				return reply(responseBuilder.result());
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

				const responseBuilder = new StringBuilder("Submission count limit per user ");
				if (value === null || value <= 0) {
					responseBuilder.pushBold("removed");
				} else {
					responseBuilder.push("set to ");
					responseBuilder.pushBold(`${value}`);
				}
				return reply(responseBuilder.result());
			}
		}
	}
};

export default limit;
