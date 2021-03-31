import type Discord from "discord.js";
import { useLogger } from "../logger";
import { getEnv } from "../helpers/environment";

const logger = useLogger();

export default async function userIsQueueAdmin(
  user: Discord.User,
  guild: Discord.Guild
): Promise<boolean> {
  // Always true for server owner
  const isOwner = user.id === guild.ownerID;
  if (isOwner) {
    logger.debug(`User ${user.id} (${user.username}) owns guild ${guild.id}`);
    return true;
  }

  // Always true for user with a whitelisted role
  logger.info("Fetching admin roles...");

  // TODO: Fetch role IDs from the database
  const knownAdminRoles = [
    getEnv("EVENTS_ROLE_ID") ?? "", //
    getEnv("QUEUE_ADMIN_ROLE_ID") ?? "" //
    // getEnv("BOT_ADMIN_ROLE_ID") ?? ""
  ];

  const adminRoles = await Promise.all(
    // Resolve the roles
    knownAdminRoles.map(roleId => guild.roles.resolve(roleId))
  );
  // logger.debug(`${adminRoles.length} roles: ${JSON.stringify(adminRoles, undefined, 2)}`);

  const hasAdminRole = adminRoles.some(
    role => role?.members.has(guild.member(user)?.id ?? "") ?? false
  );
  if (hasAdminRole) {
    logger.debug(
      `User ${user.id} (${user.username}) has a whitelisted admin role in guild ${guild.id}`
    );
    return true;
  }

  logger.debug(`User ${user.id} (${user.username}) is not a queue admin in guild ${guild.id}`);
  return false;
}
