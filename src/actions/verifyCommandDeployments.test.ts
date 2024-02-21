import type { ApplicationCommandDataResolvable, Client, OAuth2Guild } from "discord.js";
import type { Logger } from "../logger.js";
import type { Command } from "../commands/index.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Collection } from "discord.js";
import { deployableCommand } from "./deployCommands.js";

vi.mock("../commands/index.js", () => ({ allCommands: new Map<string, Command>() }));
import { allCommands as _mockAllCommands } from "../commands/index.js";
const mockAllCommands = _mockAllCommands as Map<string, Command>;

import { verifyCommandDeployments } from "./verifyCommandDeployments.js";

// Mock the logger to track output
const mockLoggerDebug = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerVerbose = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLogger = {
	debug: mockLoggerDebug,
	verbose: mockLoggerVerbose,
	info: mockLoggerInfo,
	warn: mockLoggerWarn,
} as unknown as Logger;

describe("Verify command deployments", () => {
	const commands: Array<Command> = [
		// Global Commands
		{
			name: "zaphod",
			description: " ",
			requiresGuild: false,
			execute: () => undefined,
		},
		{
			name: "beeblebrox",
			description: " ",
			requiresGuild: false,
			execute: () => undefined,
		},

		// Guild-only Commands
		{
			name: "arthur",
			description: " ",
			requiresGuild: true,
			execute: () => undefined,
		},
		{
			name: "dent",
			description: " ",
			requiresGuild: true,
			execute: () => undefined,
		},
	];

	const mockFetchApplicationCommands = vi.fn();
	const mockFetchGuildCommands = vi.fn();

	const mockClient = {
		application: {
			commands: {
				fetch: mockFetchApplicationCommands,
			},
		},
		guilds: {
			fetch: vi.fn().mockResolvedValue(
				new Collection<string, OAuth2Guild>([
					[
						"guild1",
						{
							fetch: vi.fn().mockResolvedValue({
								id: "guild1",
								commands: {
									fetch: mockFetchGuildCommands,
								},
							}),
						} as unknown as OAuth2Guild,
					],
				]),
			),
		},
	} as unknown as Client<true>;

	beforeEach(() => {
		mockAllCommands.clear();
		const deployedGlobal = new Collection<string, ApplicationCommandDataResolvable>();
		const deployedGuild = new Collection<string, ApplicationCommandDataResolvable>();
		mockFetchApplicationCommands.mockResolvedValue(deployedGlobal);
		mockFetchGuildCommands.mockResolvedValue(deployedGuild);

		for (const cmd of commands) {
			mockAllCommands.set(cmd.name, cmd);
			if (cmd.requiresGuild) {
				deployedGuild.set(cmd.name, deployableCommand(cmd));
			} else {
				deployedGlobal.set(cmd.name, deployableCommand(cmd));
			}
		}
	});

	describe("Guild commands", () => {
		test("logs an ok message if the actual commands match expectations", async () => {
			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchGuildCommands).toHaveBeenCalledOnce();
			expect(mockLoggerWarn).not.toHaveBeenCalled();
			expect(mockLoggerInfo).toHaveBeenCalledOnce();
		});

		test("logs a warning if the number of commands differs", async () => {
			mockAllCommands.delete("arthur");

			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchGuildCommands).toHaveBeenCalledOnce();
			expect(mockLoggerInfo).not.toHaveBeenCalled();
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				expect.stringContaining("commands in guild 'guild1' differ"),
			);
			expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining("Expected 1"));
		});

		test("logs a warning if the command lists differ", async () => {
			mockAllCommands.delete("arthur");
			mockAllCommands.set("ford", {
				name: "ford",
				description: " ",
				requiresGuild: true,
				execute: () => undefined,
			});

			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchGuildCommands).toHaveBeenCalledOnce();
			expect(mockLoggerInfo).not.toHaveBeenCalled();
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				expect.stringContaining("commands in guild 'guild1' differ"),
			);
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				expect.stringContaining("Expected a command named 'dent'"),
			);
		});
	});

	describe("Global commands", () => {
		test("logs an ok message if the actual commands match expectations", async () => {
			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchApplicationCommands).toHaveBeenCalledOnce();
			expect(mockLoggerInfo).toHaveBeenCalledOnce();
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});

		test("logs a warning if the number of commands differs", async () => {
			mockAllCommands.delete("zaphod");

			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchApplicationCommands).toHaveBeenCalledOnce();
			expect(mockLoggerInfo).not.toHaveBeenCalled();
			expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining("commands differ"));
			expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining("Expected 1"));
		});

		test("logs a warning if the command lists differ", async () => {
			mockAllCommands.delete("zaphod");
			mockAllCommands.set("marvin", {
				name: "marvin",
				description: " ",
				requiresGuild: false,
				execute: () => undefined,
			});

			await expect(verifyCommandDeployments(mockClient, mockLogger)).resolves.toBeUndefined();
			expect(mockFetchApplicationCommands).toHaveBeenCalledOnce();
			expect(mockLoggerInfo).not.toHaveBeenCalled();
			expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining("commands differ"));
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				expect.stringContaining("Expected a command named 'marvin'"),
			);
		});
	});
});
