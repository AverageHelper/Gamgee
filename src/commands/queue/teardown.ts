import type { Subcommand } from "../Command";
import { useGuildStorage } from "../../useGuildStorage";

const teardown: Subcommand = {
	name: "teardown",
	description: "Deletes and un-sets the current queue.",
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin"],
	async execute({ guild, logger, reply }) {
		const guildStorage = useGuildStorage(guild);

		logger.info(`Forgetting queue channel for guild ${guild.id}.`);
		await guildStorage.setQueueChannel(null);
		return reply("Queue deleted.");
	}
};

export default teardown;
