import type { Snowflake } from "discord.js";
import { requireEnv } from "../../src/helpers/environment";
import { testerClient } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";
import logUser from "../../src/helpers/logUser";

const logger = useTestLogger();

const TEST_GUILD_ID = requireEnv("GUILD_ID") as Snowflake;

async function setAdminRole(
	roleKey: "QUEUE_ADMIN_ROLE_ID" | "QUEUE_CREATOR_ROLE_ID",
	isAdmin: boolean
): Promise<void> {
	const client = await testerClient();

	const user = client.user;
	if (!user) throw new Error("The tester bot has no user object");

	const guild = await client.guilds.fetch(TEST_GUILD_ID);

	const roleId = requireEnv(roleKey) as Snowflake;
	const queueAdminRole = await guild.roles.fetch(roleId);
	if (!queueAdminRole) throw new Error(`No role found with ID ${roleId}`);

	const tester = await guild.members.fetch(user);
	const didHaveAdmin = queueAdminRole.members.has(tester.id);
	if (isAdmin) {
		await tester.roles.add(queueAdminRole);
		if (!didHaveAdmin) {
			logger.info(`User ${logUser(user)} now has the '${queueAdminRole.name}' role`);
		}
	} else {
		await tester.roles.remove(queueAdminRole);
		if (didHaveAdmin) {
			logger.info(`User ${logUser(user)} no longer has the '${queueAdminRole.name}' role`);
		}
	}
}

/**
 * Grants or removes the Queue Admin role on the tester bot.
 */
export async function setIsQueueAdmin(isAdmin: boolean): Promise<void> {
	return setAdminRole("QUEUE_ADMIN_ROLE_ID", isAdmin);
}

/**
 * Grants or removes the Queue Creator role on the tester bot.
 */
export async function setIsQueueCreator(isAdmin: boolean): Promise<void> {
	return setAdminRole("QUEUE_CREATOR_ROLE_ID", isAdmin);
}
