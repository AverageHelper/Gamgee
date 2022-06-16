import type Discord from "discord.js";
import type { Command, GuildedCommand, GlobalCommand } from "../commands/index.js";
import { allCommands } from "../commands/index.js";
import { Permissions } from "discord.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { timeoutSeconds } from "../helpers/timeoutSeconds.js";
import { useLogger } from "../logger.js";

const testMode: boolean = false;
const logger = useLogger("debug");

function pluralOf(value: number | Array<unknown>): "" | "s" {
	const PLURAL = "s";
	if (typeof value === "number") {
		return value === 1 ? "" : PLURAL;
	}
	return value.length === 1 ? "" : PLURAL;
}

async function resetCommandsForGuild(guild: Discord.Guild): Promise<void> {
	logger.debug(`Clearing commands for guild ${guild.id}...`);
	if (!testMode) {
		try {
			await guild.commands.set([]); // set guild commands
		} catch (error) {
			logger.error(richErrorMessage(`Failed to reset permissions for guild ${guild.id}.`, error));
		}
	}
	logger.debug(`Commands cleared for guild ${guild.id}`);
}

async function prepareUnprivilegedCommands(
	unprivilegedCommands: Array<GuildedCommand>,
	guild: Discord.Guild
): Promise<number> {
	logger.verbose(
		`Creating ${unprivilegedCommands.length} command${pluralOf(unprivilegedCommands)}:`
	);
	unprivilegedCommands.forEach(command => {
		logger.verbose(`\t'/${command.name}'  (requires guild, any privilege)`);
	});

	if (!testMode) {
		await guild.commands.set(unprivilegedCommands);
	}

	return unprivilegedCommands.length;
}

async function preparePrivilegedCommands(
	privilegedCommands: Array<GuildedCommand>,
	guild: Discord.Guild
): Promise<number> {
	// See https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-using-default-permissions for the new way to do this

	logger.verbose(`Creating ${privilegedCommands.length} command${pluralOf(privilegedCommands)}...`);
	const results = await Promise.allSettled(
		privilegedCommands.map(async cmd => {
			try {
				logger.verbose(
					`\t'/${cmd.name}'  (requires guild, ${
						cmd.defaultMemberPermissions !== undefined ? "custom permissions" : "any privilege"
					})`
				);

				// Prepare command payload
				const payload: Discord.ApplicationCommandDataResolvable & {
					default_member_permissions?: `${bigint}`; // TODO: Remove this augmentation
					dm_permission?: boolean;
				} = {
					description: cmd.description,
					type: "CHAT_INPUT",
					name: cmd.name // TODO: Repeat this for command aliases
				};
				if (cmd.nameLocalizations !== undefined) {
					payload.nameLocalizations = cmd.nameLocalizations;
				}
				if (cmd.descriptionLocalizations !== undefined) {
					payload.descriptionLocalizations = cmd.descriptionLocalizations;
				}
				if (cmd.options !== undefined) {
					payload.options = cmd.options;
				}

				// Resolve default member permissions bitfield
				if (cmd.defaultMemberPermissions !== undefined) {
					payload.default_member_permissions = `${
						new Permissions(cmd.defaultMemberPermissions).bitfield
					}`;
				}

				// Deploy command
				let appCommand: Discord.ApplicationCommand | undefined;
				if (!testMode) {
					appCommand = await guild.commands.create(payload);
				}
				logger.debug(
					`Created command '/${cmd.name}' (${appCommand?.id ?? "test mode"}) in guild ${guild.id}`
				);

				return appCommand;
			} catch (error) {
				logger.error(
					richErrorMessage(`Failed to create command '/${cmd.name}' on guild ${guild.id}.`, error)
				);
				throw error;
			}
		})
	);

	let numberSuccessful = 0;
	results.forEach(result => {
		if (result.status === "fulfilled") {
			numberSuccessful += 1;
		}
	});
	return numberSuccessful;
}

async function prepareCommandsForGuild(
	guild: Discord.Guild,
	guildCommands: Array<GuildedCommand>
): Promise<void> {
	await resetCommandsForGuild(guild);

	const privilegedCmds = guildCommands.filter(cmd => cmd.defaultMemberPermissions !== undefined);
	const unprivilegedCmds = guildCommands.filter(cmd => cmd.defaultMemberPermissions === undefined);

	const successfulUnprivilegedPushes = await prepareUnprivilegedCommands(unprivilegedCmds, guild);
	const successfulPrivilegedPushes = await preparePrivilegedCommands(privilegedCmds, guild);

	const successfulPushes = successfulUnprivilegedPushes + successfulPrivilegedPushes;
	if (successfulPushes === guildCommands.length) {
		logger.verbose(
			`Set ${successfulPushes} command${pluralOf(successfulPushes)} on guild ${guild.id}`
		);
	} else {
		logger.info(
			`Set ${successfulPushes}/${guildCommands.length} command${pluralOf(guildCommands)} on guild ${
				guild.id
			}`
		);
	}
}

async function prepareGuildedCommands(
	guildCommands: Array<GuildedCommand>,
	client: Discord.Client<true>
): Promise<void> {
	const oAuthGuilds = await client.guilds.fetch();
	const guilds = await Promise.all(oAuthGuilds.map(async g => await g.fetch()));
	logger.debug(`I am in ${guilds.length} guild${pluralOf(guilds)}.`);
	logger.verbose(
		`${guildCommands.length} command${pluralOf(guildCommands)} require a guild: ${JSON.stringify(
			guildCommands.map(cmd => `/${cmd.name}`)
		)}`
	);
	await Promise.allSettled(guilds.map(guild => prepareCommandsForGuild(guild, guildCommands)));
}

async function prepareGlobalCommands(
	globalCommands: Array<GlobalCommand>,
	client: Discord.Client<true>
): Promise<void> {
	logger.verbose(
		`${globalCommands.length} command${pluralOf(
			globalCommands
		)} may be set globally: ${JSON.stringify(globalCommands.map(cmd => `/${cmd.name}`))}`
	);
	logger.debug(
		`Creating all ${globalCommands.length} global command${pluralOf(globalCommands)} at once...`
	);
	if (!testMode) {
		await client.application?.commands.set(globalCommands); // set global commands
	}
	logger.verbose(`Set ${globalCommands.length} global command${pluralOf(globalCommands)}.`);
}

export async function prepareSlashCommandsThenExit(client: Discord.Client<true>): Promise<void> {
	// FIXME: Command Permissions v2 can't come to discord.js quickly enough!
	/** @see https://discord.com/blog/slash-commands-permissions-discord-apps-bots */
	logger.warn(
		"Discord has changed the way command permissions work. Every command will by default be visible. Use the Integrations submenu in Server Settings to change this."
	);
	await timeoutSeconds(5);

	const commands: Array<Command> = Array.from(allCommands.values());
	logger.info(`Syncing ${commands.length} command${pluralOf(commands)}...`);

	const guildCommands: Array<GuildedCommand> = [];
	const globalCommands: Array<GlobalCommand> = [];
	commands.forEach(cmd => {
		if (cmd.requiresGuild) {
			guildCommands.push(cmd);
		} else {
			globalCommands.push(cmd);
		}
	});

	await prepareGlobalCommands(globalCommands, client);
	await prepareGuildedCommands(guildCommands, client);

	logger.info(
		`All ${commands.length} command${pluralOf(
			commands
		)} prepared. Discord will take some time to sync commands to clients.`
	);

	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}

export async function revokeSlashCommandsThenExit(client: Discord.Client<true>): Promise<void> {
	if (testMode) logger.info("Running in TEST mode");

	// FIXME: Command Permissions v2 can't come to discord.js quickly enough!
	/** @see https://discord.com/blog/slash-commands-permissions-discord-apps-bots */
	logger.warn(
		"Discord has changed the way command permissions work. Every command will by default be visible. Use the Integrations submenu in Server Settings to change this."
	);
	await timeoutSeconds(5);

	logger.info("Unregistering global commands...");
	if (!testMode) {
		await client.application?.commands.set([]);
	}
	logger.info("Unregistered global commands");

	const oAuthGuilds = await client.guilds.fetch();
	const guilds = await Promise.all(oAuthGuilds.map(async g => await g.fetch()));
	logger.info(`Unregistering commands in ${guilds.length} guild${pluralOf(guilds)}...`);
	for (const guild of guilds) {
		if (!testMode) {
			await guild.commands.set([]);
		}
		logger.info(`Unregistered commands in guild ${guild.id}`);
	}

	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0);
}
