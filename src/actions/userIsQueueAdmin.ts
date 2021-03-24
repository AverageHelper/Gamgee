import type Discord from "discord.js";
import { useLogger } from "../logger";

const logger = useLogger();

export default async function userIsQueueAdmin(
  user: Discord.User,
  guild: Discord.Guild
): Promise<boolean> {
  // Always true for server owner
  const isOwner = user.id === guild.ownerID;

  // Always true for user with the "Events" role
  let hasAdminRole = false;

  try {
    logger.info("Fetching admin roles...");

    // TODO: Fetch this from the database
    const knownAdminRoles = [
      process.env.EVENTS_ROLE_ID ?? "" //
      // process.env.BOT_ADMIN_ROLE_ID ?? ""
    ];

    const adminRoles = await Promise.all(
      knownAdminRoles //
        .map(roleId => guild.roles.resolve(roleId))
    );
    // logger.debug(`${adminRoles.length} roles: ${JSON.stringify(adminRoles, undefined, 2)}`);

    hasAdminRole = adminRoles.some(
      role => role?.members.has(guild.member(user)?.id ?? "") ?? false
    );
  } catch (error: unknown) {
    logger.error(`Couldn't fetch event: ${JSON.stringify(error, undefined, 2)}`);
  }

  const isAdmin = isOwner || hasAdminRole;
  logger.debug(`User ${user.id} is ${isAdmin ? "" : "not "}queue admin in guild ${guild.id}`);
  return isAdmin;
}
