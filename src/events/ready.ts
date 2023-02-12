import { ActivityType, Client, ClientPresence } from "discord.js";
import { deployCommands } from "../actions/deployCommands.js";
import { getEnv } from "../helpers/environment.js";
import { onEvent } from "../helpers/onEvent.js";
import { parseArgs } from "../helpers/parseArgs.js";
import { revokeCommands } from "../actions/revokeCommands.js";
import { verifyCommandDeployments } from "../actions/verifyCommandDeployments.js";
import { version as gamgeeVersion } from "../version.js";

/**
 * The event handler for when the Discord Client is ready for action
 */
export const ready = onEvent("ready", {
	once: true,
	async execute(client, logger) {
		logger.debug(`Node ${process.version}`);
		logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);
		logger.info(`Starting ${client.user.username} v${gamgeeVersion}...`);

		const args = parseArgs();

		// If we're only here to deploy commands, do that and then exit
		if (args.deploy) {
			await deployCommands(client, logger);
			client.destroy();
			return;
		}

		// If we're only here to revoke commands, do that and then exit
		if (args.revoke) {
			await revokeCommands(client, logger);
			client.destroy();
			return;
		}

		logger.verbose("*Yawn* Good morning!");
		logger.verbose("Starting...");
		logger.info(`Started Gamgee Core v${gamgeeVersion}`);

		// Sanity check for commands
		logger.info("Verifying command deployments...");
		await verifyCommandDeployments(client, logger);

		// Set user activity
		logger.info("Setting user activity");
		setActivity(client);

		if (getEnv("NODE_ENV") === "test") {
			// Don't log the tag in test mode, people might see that!
			logger.info(`Logged in as ${client.user.username}`);
		} else {
			logger.info(`Logged in as ${client.user.tag}`);
		}

		logger.info("Ready!");
	}
});

function setActivity(client: Client<true>): ClientPresence {
	// Shout out our source code.
	// This looks like crap, but it's the only way to show a custom
	// multiline string on the bot's user profile.
	return client.user.setActivity({
		type: ActivityType.Playing,
		name: "Source: github.com/AverageHelper/Gamgee",
		url: "https://github.com/AverageHelper/Gamgee"
	});
}
