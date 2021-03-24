import requireEnv from "../testUtils/requireEnv";
import { testerClient } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const QUEUE_ADMIN_ROLE_ID = requireEnv("QUEUE_ADMIN_ROLE_ID");
const TEST_GUILD_ID = requireEnv("GUILD_ID");

/**
 * Grants or removes the Queue Admin role on the tester bot.
 */
export async function setIsQueueAdmin(isAdmin: boolean): Promise<void> {
  const client = await testerClient();

  const user = client.user;
  if (!user) throw new Error("The tester bot has no user object");

  const guild = await client.guilds.fetch(TEST_GUILD_ID);
  if (!guild) throw new Error(`No accessible guild found with ID ${TEST_GUILD_ID}`);

  const queueAdminRole = await guild.roles.fetch(QUEUE_ADMIN_ROLE_ID);
  if (!queueAdminRole) throw new Error(`No role found with ID ${QUEUE_ADMIN_ROLE_ID}`);

  const tester = guild.member(user);
  if (!tester) throw new Error("The tester bot has no guild member data");

  const didHaveAdmin = queueAdminRole.members.has(tester.id);
  if (isAdmin) {
    await tester.roles.add(queueAdminRole);
    if (didHaveAdmin) {
      logger.info(`${user.tag} now has the '${queueAdminRole.name}' role`);
    }
  } else {
    await tester.roles.remove(queueAdminRole);
    if (didHaveAdmin) {
      logger.info(`${user.tag} no longer has the '${queueAdminRole.name}' role`);
    }
  }
}
