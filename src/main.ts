import "source-map-support/register";
import "reflect-metadata";
import { getEnv, requireEnv } from "./helpers/environment";
import { handleCommand } from "./handleCommand";
import { handleInteraction } from "./handleInteraction";
import { handleMessageComponent } from "./handleMessageComponent";
import { handleReactionAdd } from "./handleReactionAdd";
import {
	prepareSlashCommandsThenExit,
	revokeSlashCommandsThenExit
} from "./actions/prepareSlashCommands";
import { useLogger } from "./logger";
import { useStorage } from "./configStorage";
import { version as gamgeeVersion } from "./version";
import Discord from "discord.js";
import richErrorMessage from "./helpers/richErrorMessage";
import yargs from "yargs";

const args = yargs
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
	.help()
	.alias("help", "h").argv;

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
		partials: ["REACTION", "CHANNEL", "MESSAGE"]
	});

	// ** Handle Events **

	client.on("ready", async () => {
		logger.debug(`Process version is ${process.version}`);
		if (getEnv("NODE_ENV") === "test") {
			logger.info(`Logged in as ${client.user?.username ?? "nobody right now"}`);
		} else {
			logger.info(`Logged in as ${client.user?.tag ?? "nobody right now"}`);
		}

		if (args["deploy-commands"]) {
			await prepareSlashCommandsThenExit(client);
		} else if (args["revoke-commands"]) {
			await revokeSlashCommandsThenExit(client);
		}
	});

	if (shouldStartNormally) {
		logger.verbose("*Yawn* Good morning!");
		logger.verbose("Starting...");
		logger.debug(`NODE_ENV: ${getEnv("NODE_ENV") ?? "undefined"}`);
		logger.info(`Started Gamgee Core v${gamgeeVersion}`);

		// Handle client events
		client.on("error", error => {
			logger.error(richErrorMessage("Received client error.", error));
		});

		client.on("messageCreate", async msg => {
			const allowedMsgTypes: Array<Discord.MessageType> = ["DEFAULT", "REPLY"];
			if (!allowedMsgTypes.includes(msg.type)) return;
			try {
				const message = await msg.fetch();
				const storage = await useStorage(message.guild, logger);
				await handleCommand(client, message, storage, logger);
			} catch (error: unknown) {
				const msgDescription = JSON.stringify(msg, undefined, 2);
				logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
			}
		});

		client.on("interaction", async interaction => {
			const storage = await useStorage(interaction.guild, logger);
			if (interaction.isCommand()) {
				await handleInteraction(client, interaction, storage, logger);
			} else if (interaction.isMessageComponent()) {
				await handleMessageComponent(client, interaction, storage, logger);
			}
		});

		client.on("messageReactionAdd", async (rxn, usr) => {
			try {
				const [reaction, user] = await Promise.all([rxn.fetch(), usr.fetch()]);
				await handleReactionAdd(reaction, user, logger);
			} catch (error: unknown) {
				logger.error(richErrorMessage("Failed to handle reaction add.", error));
			}
		});
	}

	// Log in
	void client.login(requireEnv("DISCORD_TOKEN"));

	// Handle top-level errors
} catch (error: unknown) {
	logger.error(richErrorMessage("Something bad has happened and we had to stop a command.", error));
}
