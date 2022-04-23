import type { Command } from "./Command.js";
import { allLimits } from "./queue/limit.js";
import { durationString } from "../helpers/durationString.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { getQueueConfig } from "../useQueueStorage.js";
import { MessageEmbed } from "discord.js";

export const limits: Command = {
	name: "limits",
	description: "Display the song queue's submission limits.",
	requiresGuild: true,
	async execute({ guild, reply }) {
		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return reply("No queue is set up.");
		}

		const config = await getQueueConfig(queueChannel);

		// Read out the existing limits
		const embed = new MessageEmbed() //
			.setTitle("Queue Limits")
			.setDescription("Use `/cooldown` to see your cooldown time");

		allLimits.forEach(key => {
			let value: string;
			switch (key.value) {
				case "cooldown":
					if (config.cooldownSeconds !== null && config.cooldownSeconds > 0) {
						value = durationString(config.cooldownSeconds);
					} else {
						value = "none";
					}
					break;
				case "entry-duration":
					if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
						value = durationString(config.entryDurationSeconds);
					} else {
						value = "infinite";
					}
					break;
				case "count":
					if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
						value = config.submissionMaxQuantity.toString();
					} else {
						value = "infinite";
					}
					break;
			}

			embed.addField(`${key.name}:\t${value}`, key.description);
		});

		await reply({ embeds: [embed], ephemeral: true });
	}
};
