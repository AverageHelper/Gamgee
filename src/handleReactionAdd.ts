import type { Logger } from "./logger.js";
import type { MessageReaction, User } from "discord.js";
import { getEnv } from "./helpers/environment.js";
import { logUser } from "./helpers/logUser.js";

export async function handleReactionAdd(
	reaction: MessageReaction,
	user: User,
	logger: Logger,
): Promise<void> {
	// Ignore bot reactions unless we're being tested
	if (user.bot && getEnv("NODE_ENV") !== "test-e2e") {
		logger.silly(
			`Momma always said not to follow strangers. It's rude. bot: ${user.bot ? "true" : "false"}`,
		);
		return;
	}
	logger.debug(`Handling a reaction. bot: ${user.bot ? "true" : "false"}`);

	// Ignore self reactions
	if (user.id === reaction.client.user?.id) return;

	const message = reaction.message;
	logger.debug(
		`User ${logUser(user)} reacted with ${reaction.emoji.name ?? "unnamed emoji"} to message ${
			message.id
		}`,
	);

	// follow the reaction maybe?
	await Promise.resolve();
}
