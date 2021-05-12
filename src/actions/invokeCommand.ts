import type { Command, CommandContext, CommandPermission, Subcommand } from "../commands";
import { isGuildedCommandContext, resolvePermissions } from "../commands";
import { userHasRoleInGuild } from "../permissions";

type Invocable = Command | Subcommand;

async function failPermissions(context: CommandContext): Promise<void> {
  return context.replyPrivately("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
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
  if (!command.requiresGuild)
    // No guild required
    return command.execute(context);

  if (!isGuildedCommandContext(context))
    // No guild found
    return failNoGuild(context);

  if (!command.permissions)
    // No permissions demanded
    return command.execute(context);

  const permissions: Array<CommandPermission> = Array.isArray(command.permissions)
    ? await resolvePermissions(command.permissions, context.guild)
    : await command.permissions(context.guild);

  for (const permission of permissions) {
    switch (permission.type) {
      case "ROLE": {
        const userHasRole = await userHasRoleInGuild(context.user, permission.id, context.guild);
        if (permission.permission) {
          // User should have a role
          if (!userHasRole) {
            return failPermissions(context);
          }
        } else {
          // User shouldn't have a role
          if (userHasRole) {
            return failPermissions(context);
          }
        }
        break;
      }

      case "USER": {
        // User should (or shouldn't) have an identity
        const userHasId = context.user.id === permission.id;
        if (permission.permission) {
          // User should have an identity
          if (!userHasId) {
            return failPermissions(context);
          }
        } else {
          // User shouldn't have an identity
          if (userHasId) {
            return failPermissions(context);
          }
        }
        break;
      }

      default:
        return neverFallthrough(permission.type);
    }
  }

  // Caller passes permissions checks
  return command.execute(context);
}
