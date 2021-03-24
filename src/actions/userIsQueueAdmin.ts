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

  // FIXME: We need to get the role dynamically.
  const EVENTS_ROLE_ID = process.env.EVENTS_ROLE_ID ?? "";
  try {
    logger.info("Fetching admin role...");
    const eventsRole = await guild.roles.fetch(EVENTS_ROLE_ID);
    logger.debug(`Admin role: ${JSON.stringify(eventsRole, undefined, 2)}`);
    hasAdminRole = eventsRole?.members.has(guild.member(user)?.id ?? "") ?? false;
  } catch (error: unknown) {
    logger.error(`Couldn't fetch event: ${JSON.stringify(error, undefined, 2)}`);
  }

  const isAdmin = isOwner || hasAdminRole;
  logger.debug(`User ${user.id} is ${isAdmin ? "" : "not "}queue admin in guild ${guild.id}`);
  return isAdmin;
}
