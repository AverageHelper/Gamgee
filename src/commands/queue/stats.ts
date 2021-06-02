import type { Subcommand } from "../Command";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";

const stats: Subcommand = {
	name: "stats",
	description: "Print statistics on the current queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute({ guild, channel, logger, reply, replyPrivately, deleteInvocation }) {
		const queueChannel = await getQueueChannel(guild);

		if (!queueChannel) {
			return reply(`No queue is set up. Would you like to start one?`);
		}

		// Get the current queue's status
		const queueIsCurrent = channel?.id === queueChannel.id;
		const queue = useQueue(queueChannel);
		const [count, playtimeRemaining, playtimeTotal] = await Promise.all([
			queue.count(),
			queue.playtimeRemaining(),
			queue.playtimeTotal()
		]);
		const playtimePlayed = playtimeTotal - playtimeRemaining;
		logger.info(
			`Info requested: ${durationString(playtimePlayed)} of ${durationString(
				playtimeTotal
			)} played. (${durationString(playtimeRemaining)} remaining in queue)`
		);

		const responseBuilder = new StringBuilder();
		responseBuilder.push(`Queue channel: <#${queueChannel.id}>`);
		if (queueIsCurrent) {
			responseBuilder.push(" (in here)");
		}
		responseBuilder.pushNewLine();

		if (count) {
			const singular = count === 1;
			const are = singular ? "is" : "are";
			const s = singular ? "" : "s";

			responseBuilder.push(`There ${are} `);
			responseBuilder.pushBold(`${count} song${s}`);
			responseBuilder.push(" in the queue, with ");

			if (playtimeRemaining === 0) {
				responseBuilder.pushBold(`all ${durationString(playtimeTotal)}`);
				responseBuilder.push(" played.");
			} else if (playtimePlayed === 0) {
				responseBuilder.pushBold(durationString(playtimeRemaining));
				responseBuilder.push(" total playtime remaining.");
			} else {
				responseBuilder.pushBold(durationString(playtimeRemaining));
				responseBuilder.push(" playtime remaining of ");
				responseBuilder.pushBold(durationString(playtimeTotal));
				responseBuilder.push(" total.");
			}
		} else {
			responseBuilder.push("Nothing has been added yet.");
		}
		const response = responseBuilder.result();
		await Promise.all([
			queueIsCurrent ? reply(response) : replyPrivately(response), //
			deleteInvocation()
		]);
	}
};

export default stats;
