import type Discord from "discord.js";
import { useLogger } from "../logger";
import logUser from "../helpers/logUser";
import { useGuildStorage } from "../useGuildStorage";

const logger = useLogger();

export default async function userIsQueueAdmin(
  user: Discord.User,
  guild: Discord.Guild
): Promise<boolean> {
  // Always true for server owner
  const isOwner = user.id === guild.ownerID;
  if (isOwner) {
    logger.debug(`User ${logUser(user)} owns guild ${guild.id}`);
    return true;
  }

  // Always true for user with a whitelisted role
  logger.info("Fetching admin roles...");
  const guildStorage = useGuildStorage(guild);
  const knownAdminRoleIDs = await guildStorage.getQueueAdminRoles();

  const adminRoles = await Promise.all(
    // Resolve the roles
    knownAdminRoleIDs.map(roleId => guild.roles.resolve(roleId))
  );
  // logger.debug(`${adminRoles.length} roles: ${JSON.stringify(adminRoles, undefined, 2)}`);

  const hasAdminRole = adminRoles.some(
    role => role?.members.has(guild.member(user)?.id ?? "") ?? false
  );
  if (hasAdminRole) {
    logger.debug(`User ${logUser(user)} has a whitelisted admin role in guild ${guild.id}`);
    return true;
  }

  logger.debug(`User ${logUser(user)} is not a queue admin in guild ${guild.id}`);
  return false;
}
