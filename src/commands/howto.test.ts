import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../actions/assertUserCanRunCommand.js");

import { assertUserCanRunCommand } from "../actions/assertUserCanRunCommand.js";
const mockAssertUserCanRunCommand = assertUserCanRunCommand as Mock<typeof assertUserCanRunCommand>;

import type { GuildedCommandContext } from "./Command.js";
import { howto } from "./howto.js";
import { locales } from "../i18n.js";

const mockReply = vi.fn();

describe.each(locales)("How-to command in %s", guildLocale => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: { id: "some-guild" },
			guildLocale,
			reply: mockReply,
			type: "message",
		} as unknown as GuildedCommandContext;

		mockAssertUserCanRunCommand.mockResolvedValue(true);
	});

	test("informs the user how to run queue commands (message)", async () => {
		await howto.execute(context);
		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(""));

		const calls = mockReply.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});

	test("informs the user how to run queue commands (interaction)", async () => {
		context = { ...context, type: "interaction" } as unknown as GuildedCommandContext;
		await howto.execute(context);
		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(""));

		const calls = mockReply.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});
});
