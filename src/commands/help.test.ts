import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../actions/assertUserCanRunCommand.js");

import { assertUserCanRunCommand } from "../actions/assertUserCanRunCommand.js";
const mockAssertUserCanRunCommand = assertUserCanRunCommand as Mock<typeof assertUserCanRunCommand>;

import type { GuildedCommandContext } from "./Command.js";
import { DEFAULT_LOCALE, locales } from "../i18n.js";
import { isPermissionAliasList } from "./Command.js";
import { help } from "./help.js";

const mockReplyPrivately = vi.fn();

describe("Help command", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			type: "interaction",
			guild: {
				id: "the-guild",
			},
			channel: {
				id: "the-channel",
			},
			storage: null,
			userLocale: DEFAULT_LOCALE,
			replyPrivately: mockReplyPrivately,
		} as unknown as GuildedCommandContext;

		mockAssertUserCanRunCommand.mockResolvedValue(true);
	});

	test("describes all commands", async () => {
		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining(""));

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	}, 10_000);

	test.each(locales.map(l => [l]))(
		"describes all commands in %s",
		async userLocale => {
			context = { ...context, userLocale };

			await help.execute(context);
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining(""));

			const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
			const description = calls[0];
			expect(description).toMatchSnapshot();
		},
		10_000,
	);

	test("describes pleb commands", async () => {
		mockAssertUserCanRunCommand.mockImplementation((_, command) => {
			if (
				isPermissionAliasList(command.permissions) &&
				command.permissions.some(perm => ["owner", "admin", "queue-admin"].includes(perm))
			) {
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		});

		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining(""));

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});
});
