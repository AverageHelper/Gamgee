import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { setQueueChannel } from "../../useGuildStorage.js";

export const teardown: Subcommand = {
	name: "teardown",
	description: "Deletes and un-sets the current queue.",
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "admin"],
	async execute({ guild, logger, reply }) {
		logger.info(`Forgetting queue channel for guild ${guild.id}.`);
		await setQueueChannel(null, guild);
		return await reply("Queue deleted.");
	}
};
