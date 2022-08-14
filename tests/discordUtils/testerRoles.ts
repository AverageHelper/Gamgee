import type { Snowflake } from "discord.js";
import { logUser } from "../../src/helpers/logUser";
import { requireEnv, useTesterClient } from "./testerClient";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

const TEST_GUILD_ID: Snowflake = requireEnv("GUILD_ID");

async function setAdminRole(
	roleKey: "QUEUE_ADMIN_ROLE_ID" | "QUEUE_CREATOR_ROLE_ID",
	isAdmin: boolean
): Promise<void> {
	await useTesterClient(async client => {
		const user = client.user;
		const guild = await client.guilds.fetch(TEST_GUILD_ID);

		const roleId: Snowflake = requireEnv(roleKey);
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
	});
}

/**
 * Grants or removes the Queue Admin role on the tester bot.
 */
export async function setIsQueueAdmin(isAdmin: boolean): Promise<void> {
	await setAdminRole("QUEUE_ADMIN_ROLE_ID", isAdmin);
}

/**
 * Grants or removes the Queue Creator role on the tester bot.
 */
export async function setIsQueueCreator(isAdmin: boolean): Promise<void> {
	await setAdminRole("QUEUE_CREATOR_ROLE_ID", isAdmin);
}
