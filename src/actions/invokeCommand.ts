import type { Command, CommandContext, CommandPermission, Subcommand } from "../commands";
import { isGuildedCommandContext, resolvePermissions } from "../commands";
import { useLogger } from "../logger";
import { userHasRoleInGuild } from "../permissions";

const logger = useLogger();

type Invocable = Command | Subcommand;

async function failPermissions(context: CommandContext): Promise<void> {
  return context.replyPrivately("You don't have permission to run that command.");
}

async function failNoGuild(context: CommandContext): Promise<void> {
  return context.reply("Can't do that here.", { ephemeral: true });
}

function neverFallthrough(val: never): never {
  throw new TypeError(`Unexpected case: ${JSON.stringify(val)}`);
}

/**
 * Runs the command if the invocation context satisfies the command's
 * declared guild and permission requirements.
 *
 * @param command The command to execute.
 * @param context The invocation context.
 */
export async function invokeCommand(command: Invocable, context: CommandContext): Promise<void> {
  if (!command.requiresGuild) {
    // No guild required
    logger.debug(`Command '${command.name}' does not require guild information.`);
    logger.debug("Proceeding...");
    return command.execute(context);
  }

  if (!isGuildedCommandContext(context)) {
    // No guild found
    logger.debug(`Command '${command.name}' requires guild information, but none was found.`);
    return failNoGuild(context);
  }

  if (!command.permissions) {
    // No permissions demanded
    logger.debug(`Command '${command.name}' does not require specific user permissions.`);
    logger.debug("Proceeding...");
    return command.execute(context);
  }

  const permissions: Array<CommandPermission> = Array.isArray(command.permissions)
    ? await resolvePermissions(command.permissions, context.guild)
    : await command.permissions(context.guild);

  logger.debug(
    `Command '${command.name}' requires that callers satisfy 1 of ${permissions.length} cases:`
  );

  let idx = 0;
  for (const permission of permissions) {
    idx += 1;
    logger.debug(
      `\tCase ${idx}: User must${
        permission.permission ? "" : " not"
      } have ${permission.type.toLowerCase()} ID: ${permission.id}`
    );
    switch (permission.type) {
      case "ROLE": {
        const userHasRole = await userHasRoleInGuild(context.user, permission.id, context.guild);
        logger.debug(`\tUser ${userHasRole ? "has" : "does not have"} role ${permission.id}`);
        if (permission.permission && userHasRole) {
          logger.debug("\tProceeding...");
          return command.execute(context);
        }
        break;
      }

      case "USER": {
        const userHasId = context.user.id === permission.id;
        logger.debug(`\tUser ${userHasId ? "has" : "does not have"} ID ${permission.id}`);
        if (permission.permission && userHasId) {
          logger.debug("\tProceeding...");
          return command.execute(context);
        }
        break;
      }

      default:
        return neverFallthrough(permission.type);
    }
  }

  // Caller fails permissions checks
  logger.debug("User did not pass any permission checks.");
  return failPermissions(context);
}
