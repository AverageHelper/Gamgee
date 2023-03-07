import type {
	ApplicationCommandData,
	ApplicationCommandDataResolvable,
	Client,
	Guild
} from "discord.js";
import type { Command, GlobalCommand, GuildedCommand } from "../commands/index.js";
import type { Logger } from "../logger.js";
import { ApplicationCommandType } from "discord.js";
import { allCommands } from "../commands/index.js";
import { isNonEmptyArray } from "../helpers/guards.js";
import { revokeCommands } from "./revokeCommands.js";
import { DEFAULT_LOCALE, localeIfSupported, locales, t } from "../i18n.js";

export async function deployCommands(client: Client<true>, logger: Logger): Promise<void> {
	await revokeCommands(client, logger); // fresh start!

	logger.info("Deploying commands...");
	const commands: Array<Command> = Array.from(allCommands.values());
	if (commands.length === 0) return;
	logger.info(`Syncing ${commands.length} command(s)...`);

	const guildCommands: Array<GuildedCommand> = [];
	const globalCommands: Array<GlobalCommand> = [];
	for (const cmd of commands) {
		if (!cmd.requiresGuild) {
			globalCommands.push(cmd);
		} else if (cmd.requiresGuild) {
			guildCommands.push(cmd);
		}
	}

	if (isNonEmptyArray(globalCommands)) {
		await prepareGlobalCommands(globalCommands, client, logger);
	}
	if (isNonEmptyArray(guildCommands)) {
		await prepareGuildedCommands(guildCommands, client, logger);
	}

	logger.info(
		`All ${commands.length} command(s) prepared. Discord may take some time to sync commands to clients.`
	);
}

async function prepareGlobalCommands(
	globalCommands: NonEmptyArray<GlobalCommand>,
	client: Client<true>,
	logger: Logger
): Promise<void> {
	const commandBuilders = globalCommands;
	logger.info(
		`${globalCommands.length} command(s) will be set globally: ${JSON.stringify(
			commandBuilders.map(cmd => `${cmd.name}`)
		)}`
	);
	logger.debug(`Deploying all ${globalCommands.length} global command(s)...`);
	try {
		await client.application.commands.set(commandBuilders.map(deployableCommand));
		logger.info(`Set ${globalCommands.length} global command(s).`);
	} catch (error) {
		logger.error("Failed to set global commands:", error);
	}
}

async function prepareGuildedCommands(
	guildCommands: NonEmptyArray<GuildedCommand>,
	client: Client<true>,
	logger: Logger
): Promise<void> {
	const commandBuilders = guildCommands;
	logger.info(
		`${guildCommands.length} command(s) require a guild: ${JSON.stringify(
			commandBuilders.map(cmd => `${cmd.name}`)
		)}`
	);
	const oAuthGuilds = await client.guilds.fetch();
	const guilds = await Promise.all(oAuthGuilds.map(g => g.fetch()));
	await Promise.all(guilds.map(guild => prepareCommandsForGuild(guild, guildCommands, logger)));
}

async function prepareCommandsForGuild(
	guild: Guild,
	guildCommands: ReadonlyArray<GuildedCommand>,
	logger: Logger
): Promise<void> {
	const commandBuilders = guildCommands;
	logger.info(
		`Deploying ${guildCommands.length} guild-bound command(s): ${JSON.stringify(
			commandBuilders.map(cmd => `${cmd.name}`)
		)}`
	);
	try {
		const result = await guild.commands.set(commandBuilders.map(deployableCommand));
		logger.info(`Set ${result.size} command(s) on guild ${guild.id}`);
	} catch (error) {
		logger.error(`Failed to set commands on guild ${guild.id}:`, error);
	}
}

export function deployableCommand(cmd: Command): ApplicationCommandDataResolvable {
	const payload: ApplicationCommandData = {
		description: cmd.description,
		type: cmd.type ?? ApplicationCommandType.ChatInput,
		name: cmd.name // TODO: Repeat for command aliases
	};

	if (cmd.deprecated === true) {
		payload.description = `(${t("common.deprecated", DEFAULT_LOCALE)}) ${cmd.description}`;
	}

	if (cmd.nameLocalizations) {
		payload.nameLocalizations = cmd.nameLocalizations;
	}
	if (cmd.descriptionLocalizations) {
		payload.descriptionLocalizations = cmd.descriptionLocalizations;
		if (cmd.deprecated === true) {
			for (const [key, value] of Object.entries(payload.descriptionLocalizations)) {
				const locale = localeIfSupported(key);
				if (locale === null) continue;
				if (value === null) continue;
				payload.descriptionLocalizations ??= {};
				payload.descriptionLocalizations[locale] = `(${t("common.deprecated", locale)}) ${value}`;
			}
		}
	} else if (cmd.deprecated === true) {
		// Tell the people, in every language we know, that this command is obsolete.
		payload.descriptionLocalizations ??= {};
		for (const locale of locales) {
			payload.descriptionLocalizations[locale] = `(${t("common.deprecated", locale)}) ${
				cmd.description
			}`;
		}
	}

	if (cmd.options) {
		payload.options = cmd.options;
	}
	// TODO: Set defaultMemberPermissions and dmPermission

	return payload;
}
