import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../useGuildStorage.js");
vi.mock("../permissions/index.js");

import type { CommandContext, GuildedCommand, PermissionGenerator } from "../commands/index.js";
import type { Guild, GuildMember, Role } from "discord.js";
import { ApplicationCommandPermissionType } from "discord.js";
import { invokeCommand } from "./invokeCommand.js";

import { getGuildAdminRoles, getQueueAdminRoles } from "../useGuildStorage.js";
const mockGetQueueAdminRoles = getQueueAdminRoles as Mock<typeof getQueueAdminRoles>;
const mockGetGuildAdminRoles = getGuildAdminRoles as Mock<typeof getGuildAdminRoles>;

import { userHasRoleInGuild } from "../permissions/index.js";
const mockUserHasRoleInGuild = userHasRoleInGuild as Mock<typeof userHasRoleInGuild>;

const mockExecute = vi.fn<GuildedCommand["execute"]>().mockResolvedValue(undefined);
const mockReply = vi.fn<CommandContext["reply"]>().mockResolvedValue(undefined);
const mockReplyPrivately = vi.fn<CommandContext["replyPrivately"]>().mockResolvedValue(undefined);

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
			execute: mockExecute,
		};

		const guild = {
			id: "the-guild",
			ownerId: callerId,
			roles: {
				async fetch(id: string): Promise<Role | null> {
					// Promise.reject(new Error("You shouldn't get here"))
					const doesHave = await mockUserHasRoleInGuild(member, id, guild);
					return {
						id,
						members: {
							has: () => doesHave,
						},
					} as unknown as Role;
				},
			},
		} as unknown as Guild;

		const member = {
			id: callerId,
			guild,
		} as unknown as GuildMember;

		context = {
			user: {
				id: callerId,
			},
			member,
			guild,
			channel: {
				id: "the-channel",
				guild,
			},
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
		} as unknown as CommandContext;

		mockUserHasRoleInGuild.mockResolvedValue(false);

		mockGetGuildAdminRoles.mockResolvedValue([adminRoleId]);
		mockGetQueueAdminRoles.mockResolvedValue([queueAdminRoleId]);
	});

	describe("Guild Guards", () => {
		test("always executes if the command does not require a guild", async () => {
			(command as { requiresGuild: boolean }).requiresGuild = false;
			(context as { guild: null }).guild = null;
			(context as { channel: null }).channel = null;
			(context as { member: null }).member = null;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledExactlyOnceWith(context);
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
		const mockPermissions = vi.fn<PermissionGenerator>();

		beforeEach(() => {
			context = {
				...context,
				guild: {
					id: "the-guild",
					ownerId: callerId,
				} as unknown as Guild,
			};
			command = { ...command, requiresGuild: true, permissions: mockPermissions };

			mockPermissions.mockResolvedValue([]);
		});

		test("always executes if the command does not define permission requirements", async () => {
			command = { ...command, permissions: undefined };
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledExactlyOnceWith(context);
		});

		test("calls the command's permissions function for permission cases", async () => {
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockPermissions).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining(context.guild),
			);
		});

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"executes for owner if access == true ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command = { ...command, permissions: ["owner"] };
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: callerId,
							type: ApplicationCommandPermissionType.User,
							permission: true,
						},
					]);
				}
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledExactlyOnceWith(context);
			},
		);

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"does not execute for owner if access == false ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command = { ...command, permissions: [] };
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: callerId,
							type: ApplicationCommandPermissionType.User,
							permission: false,
						},
					]);
				}
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).not.toHaveBeenCalled();
			},
		);

		test.each`
			type
			${"function"}
			${"array"}
		`(
			"does not execute for admin if admins are to be permitted ($type-based perm declaration)",
			async ({ type }: { type: string }) => {
				if (type === "array") {
					command = { ...command, permissions: ["admin"] };
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: adminRoleId,
							type: ApplicationCommandPermissionType.Role,
							permission: true,
						},
					]);
				}
				mockUserHasRoleInGuild.mockResolvedValueOnce(true);
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledExactlyOnceWith(context);
			},
		);

		test("does not execute for admin if admins are to be denied", async () => {
			mockPermissions.mockResolvedValueOnce([
				{
					id: adminRoleId,
					type: ApplicationCommandPermissionType.Role,
					permission: false,
				},
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
					command = { ...command, permissions: ["queue-admin"] };
				} else {
					mockPermissions.mockResolvedValueOnce([
						{
							id: queueAdminRoleId,
							type: ApplicationCommandPermissionType.Role,
							permission: true,
						},
					]);
				}
				mockUserHasRoleInGuild.mockResolvedValueOnce(true);
				await expect(invokeCommand(command, context)).resolves.toBeUndefined();
				expect(mockExecute).toHaveBeenCalledExactlyOnceWith(context);
			},
		);

		test("does not execute for queue admin if queue admins are to be denied", async () => {
			mockPermissions.mockResolvedValueOnce([
				{
					id: queueAdminRoleId,
					type: ApplicationCommandPermissionType.Role,
					permission: false,
				},
			]);
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});
});
