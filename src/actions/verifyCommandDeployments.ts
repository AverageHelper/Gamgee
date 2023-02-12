import type { Client, Guild } from "discord.js";
import type { Logger } from "../logger.js";
import { allCommands } from "../commands/index.js";

/**
 * Verify that the deployed command list is up-to-date, and yell in the console if it's not.
 *
 * @param client The Discord.js client whose commands to validate.
 * @param logger The place to send error messages
 */
export async function verifyCommandDeployments(
	client: Client<true>,
	logger: Logger
): Promise<void> {
	const globalDiff = await diffGlobalCommandDeployments(client);
	if (globalDiff) {
		const issue = globalDiff.issue;
		const expected = globalDiff.expected;
		const actual = globalDiff.actual;
		switch (issue) {
			case "content":
				logger.warn(
					`The deployed commands differ from the expected command list: Expected a command named '${expected}', but found '${actual}'. Please redeploy.`
				);
				break;
			case "length":
				logger.warn(
					`The deployed commands differ from the expected command list: Expected ${expected} global command(s), but Discord returned ${actual}. Please redeploy.`
				);
				break;
			default:
				/* istanbul ignore next */
				assertUnreachable(issue);
		}
	}

	const guildedDiff = await diffGuildCommandDeployments(client, logger);
	if (guildedDiff) {
		const issue = guildedDiff.issue;
		const expected = guildedDiff.expected;
		const actual = guildedDiff.actual;
		const guildId = guildedDiff.guild.id;
		switch (issue) {
			case "content":
				logger.warn(
					`The deployed commands in guild '${guildId}' differ from the expected command list: Expected a command named '${expected}', but found '${actual}'. Please redeploy.`
				);
				break;
			case "length":
				logger.warn(
					`The deployed commands in guild '${guildId}' differ from the expected command list: Expected ${expected} command(s), but Discord returned ${actual}. Please redeploy.`
				);
				break;
			default:
				/* istanbul ignore next */
				assertUnreachable(issue);
		}
	}

	if (!globalDiff && !guildedDiff) {
		logger.info("All commands deployed properly!");
	}
}

async function diffGuildCommandDeployments(
	client: Client<true>,
	logger: Logger
): Promise<(Diff & { guild: Guild }) | null> {
	const oAuthGuilds = await client.guilds.fetch();
	const guilds = await Promise.all(oAuthGuilds.map(g => g.fetch()));

	logger.verbose(`I'm part of ${guilds.length} guild(s)`);

	const expectedCommandNames = Array.from(allCommands.values())
		.filter(c => c.requiresGuild)
		.map(c => c.name)
		.sort(sortAlphabetically);

	for (const guild of guilds) {
		const guildCommands = await guild.commands.fetch();
		const actualCommandNames = Array.from(guildCommands.values())
			.map(c => c.name)
			.sort(sortAlphabetically);

		const diff = diffArrays(expectedCommandNames, actualCommandNames);
		if (diff) return { ...diff, guild };
	}

	return null; // all clear!
}

async function diffGlobalCommandDeployments(client: Client<true>): Promise<Diff | null> {
	const expectedCommandNames = Array.from(allCommands.values())
		.filter(c => !c.requiresGuild)
		.map(c => c.name)
		.sort(sortAlphabetically);

	const actualCommandNames = (await client.application.commands.fetch())
		.map(c => c.name)
		.sort(sortAlphabetically);

	return diffArrays(expectedCommandNames, actualCommandNames);
}

// MARK: - Difference between arrays

interface Diff {
	readonly issue: "length" | "content";
	readonly expected: string | number;
	readonly actual: string | number;
}

function diffArrays(expected: Array<string>, actual: Array<string>): Diff | null {
	if (actual.length !== expected.length) {
		return {
			issue: "length",
			expected: expected.length,
			actual: actual.length
		};
	}

	for (let idx = 0; idx < actual.length; idx++) {
		const deployedName = actual[idx] ?? "";
		const expectedName = expected[idx] ?? "";
		if (deployedName !== expectedName) {
			return {
				issue: "content",
				expected: expectedName,
				actual: deployedName
			};
		}
	}

	return null; // all clear!
}

function sortAlphabetically(a: string, b: string): number {
	return a.localeCompare(b);
}

/* istanbul ignore next */
function assertUnreachable(value: never): never {
	throw new EvalError(`Unreachable case: ${JSON.stringify(value)}`);
}
