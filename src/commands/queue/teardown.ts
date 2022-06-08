import type { Subcommand } from "../Command.js";
import { setQueueChannel } from "../../useGuildStorage.js";

export const teardown: Subcommand = {
	name: "teardown",
	description: "Deletes and un-sets the current queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	// permissions: ["owner", "admin"], // TODO: Make this a separate command so that only server admins can use it by default
	async execute({ guild, logger, reply }) {
		logger.info(`Forgetting queue channel for guild ${guild.id}.`);
		await setQueueChannel(null, guild);
		return reply("Queue deleted.");
	}
};
