jest.mock("../useGuildStorage");

import type Discord from "discord.js";
import type { CommandContext, GlobalCommand, GuildedCommand } from "../commands/index.js";
import { invokeCommand } from "./invokeCommand.js";

import { getGuildAdminRoles, getQueueAdminRoles } from "../useGuildStorage.js";
const mockGetQueueAdminRoles = getQueueAdminRoles as jest.Mock;
const mockGetGuildAdminRoles = getGuildAdminRoles as jest.Mock;

jest.mock("../userHasOneOfRoles.js");
import { userHasRoleInGuild } from "../userHasOneOfRoles.js";
const mockUserHasRoleInGuild = userHasRoleInGuild as jest.Mock;

const mockExecute = jest.fn().mockResolvedValue(undefined);
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
		} as unknown as GuildedCommand;

		context = {
			user: {
				id: callerId
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
		beforeEach(() => {
			command.requiresGuild = true;
			context = {
				...context,
				guild: {
					id: "the-guild",
					ownerId: callerId
				} as unknown as Discord.Guild
			};
		});

		test("executes if the command does not define permission requirements", async () => {
			delete command.defaultMemberPermissions;
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("does not execute for owner if access is by default denied", async () => {
			command.defaultMemberPermissions = [];
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).not.toHaveBeenCalled();
		});

		test("executes for owner if access is by default allowed for admins", async () => {
			command.defaultMemberPermissions = ["ADMINISTRATOR"];
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("does not execute for admin if admins are to be permitted", async () => {
			command.defaultMemberPermissions = ["ADMINISTRATOR"];
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});

		test("executes for queue admin if admins are to be permitted", async () => {
			command.defaultMemberPermissions = ["MANAGE_EVENTS"];
			mockUserHasRoleInGuild.mockResolvedValueOnce(true);
			await expect(invokeCommand(command, context)).resolves.toBeUndefined();
			expect(mockExecute).toHaveBeenCalledTimes(1);
			expect(mockExecute).toHaveBeenCalledWith(context);
		});
	});
});
