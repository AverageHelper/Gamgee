import type { Subcommand } from "../Command";
import { setQueueChannel } from "../../useGuildStorage";

const teardown: Subcommand = {
	name: "teardown",
	description: "Deletes and un-sets the current queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin"],
	async execute({ guild, logger, reply }) {
		logger.info(`Forgetting queue channel for guild ${guild.id}.`);
		await setQueueChannel(null, guild);
		return reply("Queue deleted.");
	}
};

export default teardown;
