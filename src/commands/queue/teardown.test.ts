import "../../../tests/testUtils/leakedHandles.js";

jest.mock("../../useGuildStorage");

import { setQueueChannel } from "../../useGuildStorage.js";
const mockSetQueueChannel = setQueueChannel as jest.Mock;

import type { GuildedCommandContext } from "../Command.js";
import { teardown } from "./teardown.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockReply = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Queue teardown", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the guild",
			logger,
			reply: mockReply
		} as unknown as GuildedCommandContext;

		mockSetQueueChannel.mockResolvedValue(undefined);
	});

	test("unsets the guild queue", async () => {
		await expect(teardown.execute(context)).resolves.toBeUndefined();

		expect(mockReply).toHaveBeenCalledOnce();
		expect(mockReply).toHaveBeenCalledWith("Queue deleted.");
		expect(mockSetQueueChannel).toHaveBeenCalledOnce();
		expect(mockSetQueueChannel).toHaveBeenCalledWith(null, context.guild);
	});
});
