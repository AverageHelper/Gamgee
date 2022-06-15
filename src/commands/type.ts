import type { Command } from "./Command.js";

export const t: Command = {
	name: "t",
	description: "Start a typing indicator.",
	requiresGuild: false,
	async execute({ type, channel, client, logger, reply, deleteInvocation, sendTyping }) {
		if (!channel) return reply({ content: "This doesn't work as well in DMs.", ephemeral: true });

		logger.debug(
			`${client.user?.username.concat(" is") ?? "I am"} typing in channel ${channel.id}...`
		);
		await deleteInvocation();
		if (type === "interaction") {
			// We're going to stop typing in a bit. We `await` here, not `return`.
			await reply({
				content: "So, I started typing here... but I don't think I'll finish my message :P",
				ephemeral: true
			});
		}

		sendTyping();

		await new Promise(resolve => setTimeout(resolve, 10000));
		logger.debug(`Finished typing in channel ${channel.id}`);
	}
};
