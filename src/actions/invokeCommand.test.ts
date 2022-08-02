jest.mock("../useGuildStorage");
jest.mock("../permissions");

import type Discord from "discord.js";
import type {
	CommandContext,
	CommandPermission,
	GlobalCommand,
	GuildedCommand
} from "../commands/index.js";
import { ApplicationCommandPermissionType } from "discord.js";
import { invokeCommand } from "./invokeCommand.js";

import { getGuildAdminRoles, getQueueAdminRoles } from "../useGuildStorage.js";
const mockGetQueueAdminRoles = getQueueAdminRoles as jest.Mock;
const mockGetGuildAdminRoles = getGuildAdminRoles as jest.Mock;

import { userHasRoleInGuild } from "../permissions/index.js";
const mockUserHasRoleInGuild = userHasRoleInGuild as jest.Mock<
	Promise<boolean>,
	[user: Discord.GuildMember, roleId: string, guild: Discord.Guild]
>;

const mockExecute = jest.fn<Promise<void>, Array<unknown>>().mockResolvedValue(undefined);
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

describe("Invoke Command", () => {
	const callerId = "the-user";
	const adminRoleId = "admin";
	const queueAdminRoleId = "queue-admin";

	let command: GuildedCommand;
	let context: CommandContext;

	beforeEach(() => {
		command = {
			name: "test",
			description: "A sample command",
			requiresGuild: true,
			execute: mockExecute
		};

		const guild = {
			id: "the-guild",
			ownerId: callerId,
			roles: {
				async fetch(id: string): Promise<Discord.Role | null> {
					// Promise.reject(new Error("You shouldn't get here"))
					const doesHave = await mockUserHasRoleInGuild(member, id, guild);
					return {
						id,
						members: {
							has: () => doesHave
						}
					} as unknown as Discord.Role;
				}
			}
		} as unknown as Discord.Guild;

		const member = {
			id: callerId,
			guild
		} as unknown as Discord.GuildMember;

		context = {
			user: {
				id: callerId
			},
			member,
			guild,
			channel: {
				id: "the-channel",
				guild
			},
			reply: mockReply,
			replyPrivately: mockReplyPrivately
		} as unknown as CommandContext;

		mockUserHasRoleInGuild.mockResolvedValue(false);

		mockGetGuildAdminRoles.mockResolvedValue([adminRoleId]);
		mockGetQueueAdminRoles.mockResolvedValue([queueAdminRoleId]);
	});

	describe("Guild Guards", () => {
		test("always executes if the command does not require a guild", async () => {
			(command as unknown as GlobalCommand).requiresGuild = false;
			(context as { guild: null }).guild = null;
			(context as { channel: null }).channel = null;
			(context as { member: null }).member = null;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("never executes if the command requires a guild and context does not have one", async () => {
			(context as { guild: null }).guild = null;
			(context as { channel: null }).channel = null;
			(context as { member: null }).member = null;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});

	describe("Permission Guards", () => {
		const mockPermissions = jest.fn<
			Array<CommandPermission> | Promise<Array<CommandPermission>>,
			[guild: Discord.Guild]
		>();

		beforeEach(() => {
			command.requiresGuild = true;
			context = {
				...context,
				guild: {
					id: "the-guild",
					ownerId: callerId
				} as unknown as Discord.Guild
			};
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
			expect(mockPermissions).toHaveBeenCalledWith(expect.objectContaining(context.guild));
		});

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"executes for owner if access == true ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command.permissions = ["owner"];
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: callerId,
							type: ApplicationCommandPermissionType.User,
							permission: true
						}
					]);
				}
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledTimes(1);
				expect(mockExecute).toHaveBeenCalledWith(context);
			}
		);

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"does not execute for owner if access == false ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command.permissions = [];
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: callerId,
							type: ApplicationCommandPermissionType.User,
							permission: false
						}
					]);
				}
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).not.toHaveBeenCalled();
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
							type: ApplicationCommandPermissionType.Role,
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
					type: ApplicationCommandPermissionType.Role,
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
							type: ApplicationCommandPermissionType.Role,
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
					type: ApplicationCommandPermissionType.Role,
					permission: false
				}
			]);
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});
});
