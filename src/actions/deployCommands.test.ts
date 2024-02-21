import type { Client } from "discord.js";
import type { Command } from "../commands/index.js";
import type { Mock } from "vitest";
import { ApplicationCommandOptionType } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger();

const mockAllCommands = vi.hoisted(() => new Map<string, Command>());
vi.mock("../commands/index.js", () => ({ allCommands: mockAllCommands }));

vi.mock("./revokeCommands.js");
import { revokeCommands } from "./revokeCommands.js";
const mockRevokeCommands = revokeCommands as Mock<
	Parameters<typeof revokeCommands>,
	ReturnType<typeof revokeCommands>
>;

import { deployCommands } from "./deployCommands.js";

describe("Command deployments", () => {
	const mockApplicationCommandsSet = vi.fn();
	const mockGuildCommandsSet = vi.fn();
	const mockFetchOauthGuilds = vi.fn();

	const mockClient = {
		application: {
			commands: {
				set: mockApplicationCommandsSet,
			},
		},
		guilds: {
			fetch: mockFetchOauthGuilds,
		},
	} as unknown as Client<true>;

	beforeEach(() => {
		mockRevokeCommands.mockResolvedValue(undefined);
		mockApplicationCommandsSet.mockResolvedValue(undefined);
		mockGuildCommandsSet.mockImplementation(values => Promise.resolve(values));
		mockFetchOauthGuilds.mockResolvedValue([
			{
				fetch: (): Promise<unknown> =>
					Promise.resolve({
						id: "test-guild1",
						commands: {
							set: mockGuildCommandsSet,
						},
					}),
			},
		]);
		const mockCommands: NonEmptyArray<Command> = [
			{
				name: "test1",
				description: " ",
				requiresGuild: false,
				execute: () => undefined,
			},
			{
				name: "test2",
				nameLocalizations: {},
				description: " ",
				requiresGuild: true,
				execute: () => undefined,
			},
			{
				name: "test3",
				nameLocalizations: {},
				description: " ",
				descriptionLocalizations: {},
				requiresGuild: true,
				execute: () => undefined,
			},
			{
				name: "test4",
				nameLocalizations: {},
				description: " ",
				descriptionLocalizations: {},
				options: [
					{
						name: "c",
						description: " ",
						type: ApplicationCommandOptionType.String,
					},
				],
				requiresGuild: true,
				execute: () => undefined,
			},
			{
				name: "test5",
				nameLocalizations: {},
				description: " ",
				descriptionLocalizations: {},
				defaultMemberPermissions: undefined, // TODO: Is this correct
				options: [
					{
						name: "c",
						description: " ",
						type: ApplicationCommandOptionType.String,
					},
				],
				requiresGuild: true,
				execute: () => undefined,
			},
			{
				name: "test6",
				nameLocalizations: {},
				description: " ",
				descriptionLocalizations: {},
				dmPermission: undefined, // TODO: Is this correct
				options: [
					{
						name: "c",
						description: " ",
						type: ApplicationCommandOptionType.String,
					},
				],
				requiresGuild: true,
				execute: () => undefined,
			},
		];
		for (const cmd of mockCommands) {
			mockAllCommands.set(cmd.name, cmd);
		}
	});

	test("does no deployments if there are no commands to deploy", async () => {
		mockAllCommands.clear();
		await expect(deployCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockRevokeCommands).toHaveBeenCalledOnce();
		expect(mockApplicationCommandsSet).not.toHaveBeenCalled();
		expect(mockGuildCommandsSet).not.toHaveBeenCalled();
		expect(mockFetchOauthGuilds).not.toHaveBeenCalled();
	});

	test("calls mockRevokeCommands before any deployments", async () => {
		await expect(deployCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockRevokeCommands).toHaveBeenCalledOnce();
		// TODO: Can we even assert these without `jest-extended`?
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockApplicationCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockGuildCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockFetchOauthGuilds);
	});

	test("continues deployments if global commands fail to deploy", async () => {
		mockApplicationCommandsSet.mockRejectedValueOnce(new Error("This is a test"));
		await expect(deployCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockRevokeCommands).toHaveBeenCalledOnce();
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockApplicationCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockGuildCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockFetchOauthGuilds);
	});

	test("continues deployments if guild-bound commands fail to deploy", async () => {
		mockGuildCommandsSet.mockRejectedValueOnce(new Error("This is a test"));
		await expect(deployCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockRevokeCommands).toHaveBeenCalledOnce();
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockApplicationCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockGuildCommandsSet);
		// expect(mockRevokeCommands).toHaveBeenCalledBefore(mockFetchOauthGuilds);
	});
});
