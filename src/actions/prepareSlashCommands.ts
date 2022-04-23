import type Discord from "discord.js";
import type { Command, GuildedCommand, GlobalCommand } from "../commands/index.js";
import { allCommands, resolvePermissions } from "../commands/index.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { useLogger } from "../logger.js";

const testMode: boolean = false;
const logger = useLogger("verbose");

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
		await guild.commands.set([]); // set guild commands
		await guild.commands.permissions.set({ fullPermissions: [] }); // set guild commands
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
	let successfulPrivilegedPushes = 0;
	logger.verbose(`Creating ${privilegedCommands.length} command${pluralOf(privilegedCommands)}...`);
	await Promise.allSettled(
		privilegedCommands.map(async cmd => {
			try {
				let appCommand: Discord.ApplicationCommand | undefined;
				const permissions = cmd.permissions
					? Array.isArray(cmd.permissions)
						? cmd.permissions.join(", ")
						: "custom permissions"
					: "any privilege";
				logger.verbose(`\t'/${cmd.name}'  (requires guild, ${permissions})`);
				if (!testMode) {
					appCommand = await guild.commands.create(cmd);
					logger.debug(`Created command '/${cmd.name}' (${appCommand.id}) in guild ${guild.id}`);
				} else {
					logger.debug(`Created command '/${cmd.name}' in guild ${guild.id}`);
				}

				if (cmd.permissions) {
					const permissions = Array.isArray(cmd.permissions)
						? await resolvePermissions(cmd.permissions, guild)
						: await cmd.permissions(guild);
					if (appCommand) {
						await appCommand.permissions.set({ permissions });
						logger.debug(
							`Set permissions for command '/${cmd.name}' (${appCommand.id}) in guild ${guild.id}`
						);
					} else {
						logger.debug(`Set permissions for command '/${cmd.name}' in guild ${guild.id}`);
					}
				}

				successfulPrivilegedPushes += 1;
				return appCommand;
			} catch (error) {
				logger.error(
					richErrorMessage(`Failed to create command '/${cmd.name}' on guild ${guild.id}`, error)
				);
				throw error;
			}
		})
	);
	return successfulPrivilegedPushes;
}

async function prepareCommandsForGuild(
	guild: Discord.Guild,
	guildCommands: Array<GuildedCommand>
): Promise<void> {
	await resetCommandsForGuild(guild);

	const privilegedCmds: Array<GuildedCommand> = guildCommands.filter(cmd => cmd.permissions);
	const unprivilegedCmds: Array<GuildedCommand> = guildCommands.filter(cmd => !cmd.permissions);

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
	client: Discord.Client
): Promise<void> {
	const guilds = [...client.guilds.cache.values()];
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
	client: Discord.Client
): Promise<void> {
	logger.verbose(
		`${globalCommands.length} command${pluralOf(
			globalCommands
		)} may be set globally: ${JSON.stringify(globalCommands.map(cmd => `/${cmd.name}`))}`
	);
	logger.debug(
		`Creating all ${globalCommands.length} global command${pluralOf(globalCommands)} at once...`
	);
	await client.application?.commands.set(globalCommands); // set global commands
	logger.verbose(`Set ${globalCommands.length} global command${pluralOf(globalCommands)}.`);
}

export async function prepareSlashCommandsThenExit(client: Discord.Client): Promise<void> {
	const commands: Array<Command> = [...allCommands.values()];
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

export async function revokeSlashCommandsThenExit(client: Discord.Client): Promise<void> {
	logger.info("Unregistering global commands...");
	if (!testMode) {
		await client.application?.commands.set([]);
	}
	logger.info("Unregistered global commands");

	const guilds = [...client.guilds.cache.values()];
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
