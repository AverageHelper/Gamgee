import "source-map-support/register.js";
import "reflect-metadata";
import { getEnv, requireEnv } from "./helpers/environment.js";
import { handleCommand } from "./handleCommand.js";
import { handleInteraction } from "./handleInteraction.js";
import { handleMessageComponent } from "./handleMessageComponent.js";
import { handleReactionAdd } from "./handleReactionAdd.js";
import { hideBin } from "yargs/helpers";
import { richErrorMessage } from "./helpers/richErrorMessage.js";
import { useLogger } from "./logger.js";
import { useStorage } from "./configStorage.js";
import { version as gamgeeVersion } from "./version.js";
import Discord from "discord.js";
import yargs from "yargs";
import {
	prepareSlashCommandsThenExit,
	revokeSlashCommandsThenExit
} from "./actions/prepareSlashCommands.js";

const args = await yargs(hideBin(process.argv))
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
	.alias("version", "v").argv;

const shouldStartNormally = !args["deploy-commands"] && !args["revoke-commands"];

const logger = useLogger();

// ** Setup Discord Client **

try {
	const client = new Discord.Client({
		intents: [
			"GUILDS",
			"GUILD_MESSAGES",
			"GUILD_MESSAGE_REACTIONS",
			"DIRECT_MESSAGES",
			"GUILD_MESSAGE_TYPING"
		],
		partials: ["REACTION", "CHANNEL", "MESSAGE"],
		allowedMentions: {
			parse: ["roles", "users"], // disallow @everyone pings
			repliedUser: true
		}
	});

	// ** Handle Events **

	client.on("ready", async client => {
		logger.debug(`Node ${process.version}`);

		if (shouldStartNormally) {
			logger.verbose("*Yawn* Good morning!");
			logger.verbose("Starting...");
			logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);
			logger.info(`Started Gamgee Core v${gamgeeVersion}`);

			client.on("messageCreate", async msg => {
				const allowedMsgTypes: Array<Discord.MessageType> = ["DEFAULT", "REPLY"];
				if (!allowedMsgTypes.includes(msg.type) || msg.author.id === client.user.id) return;
				try {
					const message = await msg.fetch();
					const storage = await useStorage(message.guild, logger);
					await handleCommand(message, storage, logger);
				} catch (error) {
					const msgDescription = JSON.stringify(msg, undefined, 2);
					logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
				}
			});

			client.on("interactionCreate", async interaction => {
				const storage = await useStorage(interaction.guild, logger);
				if (interaction.isCommand()) {
					await handleInteraction(interaction, storage, logger);
				} else if (interaction.isMessageComponent()) {
					await handleMessageComponent(interaction, logger);
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
		}

		if (getEnv("NODE_ENV") === "test") {
			// Don't log the tag in test mode, people might see that!
			logger.info(`Logged in as ${client.user.username}`);
		} else {
			logger.info(`Logged in as ${client.user.tag}`);
		}

		if (args["deploy-commands"]) {
			await prepareSlashCommandsThenExit(client);
		} else if (args["revoke-commands"]) {
			await revokeSlashCommandsThenExit(client);
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
