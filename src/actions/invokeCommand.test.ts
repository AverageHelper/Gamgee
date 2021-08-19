jest.mock("../useGuildStorage");
jest.mock("../permissions");

import type Discord from "discord.js";
import type { CommandContext, GlobalCommand, GuildedCommand } from "../commands";
import { invokeCommand } from "./invokeCommand";

import { useGuildStorage } from "../useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

import { userHasRoleInGuild } from "../permissions";
const mockUserHasRoleInGuild = userHasRoleInGuild as jest.Mock;

const mockExecute = jest.fn().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const mockGetGuildAdminRoles = jest.fn();
const mockGetQueueAdminRoles = jest.fn();

describe("Invoke Command", () => {
	const callerId = "the-user";
	const adminRoleId = "admin";
	const queueAdminRoleId = "queue-admin";

	let command: GuildedCommand;
	let context: CommandContext;

	beforeEach(() => {
		command = ({
			name: "test",
			description: "A sample command",
			requiresGuild: true,
			execute: mockExecute
		} as unknown) as GuildedCommand;

		context = ({
			user: {
				id: callerId
			},
			reply: mockReply,
			replyPrivately: mockReplyPrivately
		} as unknown) as CommandContext;

		mockUseGuildStorage.mockReturnValue({
			getGuildAdminRoles: mockGetGuildAdminRoles,
			getQueueAdminRoles: mockGetQueueAdminRoles
		});
		mockUserHasRoleInGuild.mockResolvedValue(false);

		mockGetGuildAdminRoles.mockResolvedValue([adminRoleId]);
		mockGetQueueAdminRoles.mockResolvedValue([queueAdminRoleId]);
	});

	describe("Guild Guards", () => {
		test("always executes if the command does not require a guild", async () => {
			((command as unknown) as GlobalCommand).requiresGuild = false;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("never executes if the command requires a guild and context does not have one", async () => {
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});

	describe("Permission Guards", () => {
		const mockPermissions = jest.fn();

		beforeEach(() => {
			command.requiresGuild = true;
			context.guild = ({
				id: "the-guild",
				ownerId: callerId
			} as unknown) as Discord.Guild;
			command.permissions = mockPermissions;

			mockPermissions.mockResolvedValue([]);
		});

		test("always executes if the command does not define permission requirements", async () => {
			command.permissions = undefined;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("calls the command's permissions function for permission cases", async () => {
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockPermissions).toHaveBeenCalledTimes(1);
			expect(mockPermissions).toHaveBeenCalledWith(context.guild);
		});

		test.each`
			type          | permission | desc
			${"function"} | ${true}    | ${"executes"}
			${"array"}    | ${true}    | ${"executes"}
			${"function"} | ${false}   | ${"does not execute"}
			${"array"}    | ${false}   | ${"does not execute"}
		`(
			"$desc for owner if access == $permission ($type-based perm declaration)",
			async ({ type, permission }: { type: string; permission: boolean }) => {
				if (type === "array") {
					command.permissions = permission ? ["owner"] : [];
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: callerId,
							type: "USER",
							permission
						}
					]);
				}
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				/* eslint-disable jest/no-conditional-expect */
				if (permission) {
					expect(mockExecute).toHaveBeenCalledTimes(1);
					expect(mockExecute).toHaveBeenCalledWith(context);
				} else {
					expect(mockExecute).not.toHaveBeenCalled();
				}
				/* eslint-enable jest/no-conditional-expect */
			}
		);

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"does not execute for admin if admins are to be permitted ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command.permissions = ["admin"];
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: adminRoleId,
							type: "ROLE",
							permission: true
						}
					]);
				}
				mockUserHasRoleInGuild.mockResolvedValueOnce(true);
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledTimes(1);
				expect(mockExecute).toHaveBeenCalledWith(context);
			}
		);

		test("does not execute for admin if admins are to be denied", async () => {
			mockPermissions.mockResolvedValueOnce([
				{
					id: adminRoleId,
					type: "ROLE",
					permission: false
				}
			]);
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"executes for queue admin if admins are to be permitted ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command.permissions = ["queue-admin"];
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: queueAdminRoleId,
							type: "ROLE",
							permission: true
						}
					]);
				}
				mockUserHasRoleInGuild.mockResolvedValueOnce(true);
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledTimes(1);
				expect(mockExecute).toHaveBeenCalledWith(context);
			}
		);

		test("does not execute for queue admin if queue admins are to be denied", async () => {
			mockPermissions.mockResolvedValueOnce([
				{
					id: queueAdminRoleId,
					type: "ROLE",
					permission: false
				}
			]);
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});
});
