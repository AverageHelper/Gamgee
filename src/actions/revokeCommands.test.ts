import type { Client } from "discord.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { revokeCommands } from "./revokeCommands.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Command revocations", () => {
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
		mockApplicationCommandsSet.mockResolvedValue(undefined);
		mockGuildCommandsSet.mockImplementation(vals => Promise.resolve(vals));
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
			{
				fetch: (): Promise<unknown> =>
					Promise.resolve({
						id: "test-guild2",
						commands: {
							set: mockGuildCommandsSet,
						},
					}),
			},
		]);
	});

	test("clears global commands", async () => {
		await expect(revokeCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockApplicationCommandsSet).toHaveBeenCalledOnce();
	});

	test("clears commands for each guild", async () => {
		await expect(revokeCommands(mockClient, logger)).resolves.toBeUndefined();
		expect(mockGuildCommandsSet).toHaveBeenCalledTimes(2);
	});
});
