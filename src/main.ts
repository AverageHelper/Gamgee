import "source-map-support/register.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { requireEnv } from "./helpers/environment.js";
import { richErrorMessage } from "./helpers/richErrorMessage.js";
import { registerEventHandlers } from "./events/index.js";
import { useLogger } from "./logger.js";

// We *could* do all of this at the top level,
// but then none of this setup would be testable :P

export async function _main(logger = useLogger()): Promise<void> {
	try {
		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildMessageTyping
			],
			partials: [Partials.Reaction, Partials.Channel, Partials.Message],
			allowedMentions: {
				parse: ["roles", "users"], // disallows @everyone pings
				repliedUser: true
			}
		});

		// Register all the event handlers for the client
		registerEventHandlers(client);

		// Log in
		try {
			await client.login(requireEnv("DISCORD_TOKEN"));
		} catch (error) {
			logger.error(richErrorMessage("Failed to log in.", error));
		}

		// Handle top-level errors
	} catch (error) {
		logger.error(
			richErrorMessage("Something bad has happened and we had to everything for a bit.", error)
		);
	}
}

/* istanbul ignore next */
// Not Constantinople
if (requireEnv("NODE_ENV") !== "test") {
	// Jest will never hit this without hax, but Mocha should:
	void _main();
}
