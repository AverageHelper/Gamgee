import "../../tests/testUtils/leakedHandles.js";

jest.mock("../actions/assertUserCanRunCommand");

import { assertUserCanRunCommand } from "../actions/assertUserCanRunCommand.js";
const mockAssertUserCanRunCommand = assertUserCanRunCommand as jest.Mock;

import type { GuildedCommand, GuildedCommandContext } from "./Command.js";
import { DEFAULT_LOCALE, locales } from "../i18n.js";
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
			channel: {
				id: "the-channel"
			},
			storage: null,
			userLocale: DEFAULT_LOCALE,
			replyPrivately: mockReplyPrivately
		} as unknown as GuildedCommandContext;

		mockAssertUserCanRunCommand.mockResolvedValue(true);
	});

	test("describes all commands", async () => {
		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});

	test.each(locales.map(l => [l]))("describes all commands in %s", async locale => {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		context = { ...context, userLocale: locale } as GuildedCommandContext;

		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});

	test("describe pleb commands", async () => {
		mockAssertUserCanRunCommand.mockImplementation((user, command: GuildedCommand) => {
			if (
				Array.isArray(command.permissions) &&
				command.permissions.some(perm => ["owner", "admin", "queue-admin"].includes(perm))
			) {
				return Promise.resolve(false);
			}
			return Promise.resolve(true);
		});

		await help.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.toBeString());

		const calls = mockReplyPrivately.mock.calls[0] as Array<unknown>;
		const description = calls[0];
		expect(description).toMatchSnapshot();
	});
});
