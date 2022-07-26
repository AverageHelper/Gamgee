jest.mock("../actions/invokeCommand");

import { assertUserCanRunCommand } from "../actions/invokeCommand.js";
import { Permissions } from "discord.js";
const mockAssertUserCanRunCommand = assertUserCanRunCommand as jest.Mock;

import type { GuildedCommand, GuildedCommandContext } from "./Command.js";
import { help } from "./help.js";

const mockReplyPrivately = jest.fn();

describe("Help command", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			type: "message",
			guild: {
				id: "the-guild"
			},
			storage: null,
			replyPrivately: mockReplyPrivately
		} as unknown as GuildedCommandContext;

		mockAssertUserCanRunCommand.mockResolvedValue(true);
	});

	test("describes all commands", async () => {
		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});

	test("describe pleb commands", async () => {
		mockAssertUserCanRunCommand.mockImplementation((user, command: GuildedCommand) => {
			if (new Permissions(command.defaultMemberPermissions).has("ADMINISTRATOR")) {
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		});

		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});
});
