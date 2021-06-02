import type { Command } from "./Command";
import { useQueue } from "../actions/queue/useQueue";
import getQueueChannel from "../actions/queue/getQueueChannel";
import StringBuilder from "../helpers/StringBuilder";
import durationString from "../helpers/durationString";

const limits: Command = {
	name: "limits",
	description: "Display the song queue's submission limits.",
	requiresGuild: true,
	async execute({ guild, reply }) {
		const {
			allLimits,
			ARG_ENTRY_DURATION,
			ARG_SUB_COOLDOWN,
			ARG_SUB_MAX_SUBMISSIONS
		} = await import("./queue/limit");

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return reply("No queue is set up.");
		}

		const queue = useQueue(queueChannel);
		const config = await queue.getConfig();

		// Read out the existing limits
		const responseBuilder = new StringBuilder("Queue Limits:");

		allLimits.forEach(key => {
			responseBuilder.pushNewLine();
			responseBuilder.pushCode(key);
			responseBuilder.push(" - ");

			switch (key) {
				case ARG_SUB_COOLDOWN:
					if (config.cooldownSeconds !== null && config.cooldownSeconds > 0) {
						responseBuilder.pushBold(durationString(config.cooldownSeconds));
					} else {
						responseBuilder.pushBold("none");
					}
					break;
				case ARG_ENTRY_DURATION:
					if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
						responseBuilder.pushBold(durationString(config.entryDurationSeconds));
					} else {
						responseBuilder.pushBold("infinite");
					}
					break;
				case ARG_SUB_MAX_SUBMISSIONS:
					if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
						responseBuilder.pushBold(config.submissionMaxQuantity.toString());
					} else {
						responseBuilder.pushBold("infinite");
					}
					break;
			}
		});

		return reply(responseBuilder.result());
	}
};

export default limits;
