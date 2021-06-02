import type { Command } from "./Command";

const type: Command = {
	name: "t",
	description: "Start a typing indicator.",
	requiresGuild: false,
	async execute({
		type,
		channel,
		client,
		logger,
		reply,
		deleteInvocation,
		startTyping,
		stopTyping
	}) {
		if (!channel) return reply("This doesn't work as well in DMs.");

		logger.debug(
			`${client.user?.username.concat(" is") ?? "I am"} typing in channel ${channel.id}...`
		);
		await deleteInvocation();
		if (type === "interaction") {
			// We're going to stop typing in a bit. We `await` here, not `return`.
			await reply("So I started typing here, but I don't think I'll finish my message.", {
				ephemeral: true
			});
		}

		startTyping();

		await new Promise(resolve => setTimeout(resolve, 5000));
		stopTyping();

		logger.debug(`Finished typing in channel ${channel.id}`);
	}
};

export default type;
