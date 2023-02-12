import "source-map-support/register.js";
import "reflect-metadata";
import type { Message, PartialMessage } from "discord.js";
import { ActivityType, Client, GatewayIntentBits, MessageType, Partials } from "discord.js";
import { deployCommands } from "./actions/deployCommands.js";
import { getEnv, requireEnv } from "./helpers/environment.js";
import { handleButton } from "./handleButton.js";
import { handleCommand } from "./handleCommand.js";
import { handleInteraction } from "./handleInteraction.js";
import { handleReactionAdd } from "./handleReactionAdd.js";
import { hideBin } from "yargs/helpers";
import { revokeCommands } from "./actions/revokeCommands.js";
import { richErrorMessage } from "./helpers/richErrorMessage.js";
import { useLogger } from "./logger.js";
import { verifyCommandDeployments } from "./actions/verifyCommandDeployments.js";
import { version as gamgeeVersion } from "./version.js";
import yargs from "yargs";

const args = yargs(hideBin(process.argv))
	.option("deploy-commands", {
		alias: "c",
		description: "Upload Discord commands, then exit",
		type: "boolean",
		default: false
	})
	.option("revoke-commands", {
		alias: "C",
		description: "Revoke Discord commands, then exit",
		type: "boolean",
		default: false
	})
	.version(gamgeeVersion)
	.help()
	.alias("help", "h")
	.alias("version", "v")
	.parseSync();

const shouldStartNormally = !args["deploy-commands"] && !args["revoke-commands"];

const logger = useLogger();

// MARK: - Setup Discord Client

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

	// MARK: Handle Events

	client.on("ready", async client => {
		logger.debug(`Node ${process.version}`);

		if (shouldStartNormally) {
			logger.verbose("*Yawn* Good morning!");
			logger.verbose("Starting...");
			logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);

			const oAuthGuilds = await client.guilds.fetch();
			const knownGuilds = await Promise.all(oAuthGuilds.map(async g => await g.fetch()));
			logger.verbose(`I'm part of ${knownGuilds.length} guild(s)`);

			// MARK: - Do bot things
			logger.info(`Started Gamgee Core v${gamgeeVersion}`);

			// Register interaction listeners
			client.on("messageCreate", async msg => {
				// Fetch the message if it's partial
				let message: Message | PartialMessage = msg;
				if (message.partial) {
					logger.debug("Message was partial. Fetching...");
					message = await msg.fetch();
				}

				// Ignore if the message is from ourself
				if (message.author.id === client.user.id) return;

				// Ignore if the message isn't a plain message
				const allowedMsgTypes: ReadonlyArray<MessageType> = [
					MessageType.Default,
					MessageType.Reply
				];
				if (!allowedMsgTypes.includes(message.type)) {
					const allowed = allowedMsgTypes.join(", ");
					logger.debug(`Skipping message of unknown type ${message.type} (allowed: [${allowed}])`);
					return;
				}
				try {
					await handleCommand(message, logger);
				} catch (error) {
					const msgDescription = JSON.stringify(message, undefined, 2);
					logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
				}
			});

			client.on("interactionCreate", async interaction => {
				if (interaction.isCommand()) {
					await handleInteraction(interaction, logger);
				} else if (interaction.isButton()) {
					await handleButton(interaction, logger);
				}
			});

			client.on("messageReactionAdd", async (rxn, usr) => {
				try {
					const [reaction, user] = await Promise.all([rxn.fetch(), usr.fetch()]);
					await handleReactionAdd(reaction, user, logger);
				} catch (error) {
					logger.error(richErrorMessage("Failed to handle reaction add.", error));
				}
			});

			// Shout out our source code.
			// This looks like crap, but it's the only way to show a custom
			// multiline string on the bot's user profile.
			client.user.setActivity({
				type: ActivityType.Playing,
				name: "Source: github.com/AverageHelper/Gamgee",
				url: "https://github.com/AverageHelper/Gamgee"
			});

			// Sanity check for commands
			logger.info("Verifying command deployments...");
			await verifyCommandDeployments(client, logger);
		}

		if (getEnv("NODE_ENV") === "test") {
			// Don't log the tag in test mode, people might see that!
			logger.info(`Logged in as ${client.user.username}`);
		} else {
			logger.info(`Logged in as ${client.user.tag}`);
		}

		if (args["deploy-commands"]) {
			await deployCommands(client, logger);
			client.destroy();
			process.exit(0);
		} else if (args["revoke-commands"]) {
			await revokeCommands(client, logger);
			client.destroy();
			process.exit(0);
		}
	});

	client.on("error", error => {
		logger.error(richErrorMessage("Received client error.", error));
	});

	// Log in
	void client.login(requireEnv("DISCORD_TOKEN"));

	// Handle top-level errors
} catch (error) {
	logger.error(richErrorMessage("Something bad has happened and we had to stop a command.", error));
}
