import type Discord from "discord.js";
import type { Command, GuildedCommand, GlobalCommand } from "../commands";
import { allCommands, resolvePermissions } from "../commands";
import { useLogger } from "../logger";
import richErrorMessage from "../helpers/richErrorMessage";

const logger = useLogger();

function pluralOf(value: number | Array<unknown>): "" | "s" {
  const PLURAL = "s";
  if (typeof value === "number") {
    return value === 1 ? "" : PLURAL;
  }
  return value.length === 1 ? "" : PLURAL;
}

async function resetCommandsForGuild(guild: Discord.Guild): Promise<void> {
  logger.debug(`Resetting commands for guild ${guild.id}...`);
  await guild.commands.set([]); // set guild commands
  await guild.commands.setPermissions([]); // set guild commands
  logger.debug(`Reset commands for guild ${guild.id}`);
}

async function prepareUnprivilegedCommands(
  unprivilegedCommands: Array<GuildedCommand>,
  guild: Discord.Guild
): Promise<number> {
  let successfulUnprivilegedPushes = 0;
  logger.debug(
    `Creating all ${unprivilegedCommands.length} unprivileged command${pluralOf(
      unprivilegedCommands
    )} at once...`
  );

  await guild.commands.set(unprivilegedCommands);
  successfulUnprivilegedPushes += unprivilegedCommands.length;

  logger.verbose(
    `Set ${unprivilegedCommands.length} unprivileged command${pluralOf(unprivilegedCommands)}`
  );
  return successfulUnprivilegedPushes;
}

async function preparePrivilegedCommands(
  privilegedCommands: Array<GuildedCommand>,
  guild: Discord.Guild
): Promise<number> {
  let successfulPrivilegedPushes = 0;
  logger.debug(
    `Creating remaining ${privilegedCommands.length} privileged command${pluralOf(
      privilegedCommands
    )}...`
  );
  await Promise.allSettled(
    privilegedCommands.map(async cmd => {
      try {
        const appCommand: Discord.ApplicationCommand = await guild.commands.create(cmd);
        logger.debug(`Created command '/${cmd.name}' (${appCommand.id}) in guild ${guild.id}`);

        if (cmd.permissions) {
          const permissions = Array.isArray(cmd.permissions)
            ? await resolvePermissions(cmd.permissions, guild)
            : await cmd.permissions(guild);
          await appCommand.setPermissions(permissions);
          logger.debug(
            `Set permissions for command '/${cmd.name}' (${appCommand.id}) in guild ${guild.id}`
          );
        }

        successfulPrivilegedPushes += 1;
        return appCommand;
      } catch (error: unknown) {
        logger.error(
          richErrorMessage(`Failed to create command '/${cmd.name}' on guild ${guild.id}`, error)
        );
        throw error;
      }
    })
  );
  logger.verbose(
    `Set ${privilegedCommands.length} privileged command${pluralOf(privilegedCommands)}...`
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
  const guilds = client.guilds.cache.array();
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

export async function prepareSlashCommands(client: Discord.Client): Promise<void> {
  const commands: Array<Command> = allCommands.array();
  logger.info(
    `Syncing ${commands.length} command${pluralOf(
      commands
    )}. Message commands still work while slash commands are syncing...`
  );

  const guildCommands: Array<GuildedCommand> = [];
  const globalCommands: Array<GlobalCommand> = [];
  commands.forEach(cmd => {
    if (cmd.requiresGuild) {
      guildCommands.push(cmd);
    } else {
      globalCommands.push(cmd);
    }
  });

  await prepareGuildedCommands(guildCommands, client);
  await prepareGlobalCommands(globalCommands, client);

  logger.info(
    `All ${commands.length} command${pluralOf(
      commands
    )} prepared. Discord will take some time to sync commands to clients.`
  );
}
