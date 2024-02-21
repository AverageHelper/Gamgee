import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../useGuildStorage.js");

import { setQueueChannel } from "../../useGuildStorage.js";
const mockSetQueueChannel = setQueueChannel as Mock<
	Parameters<typeof setQueueChannel>,
	ReturnType<typeof setQueueChannel>
>;

import type { GuildedCommandContext } from "../Command.js";
import { teardown } from "./teardown.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockReply = vi.fn().mockResolvedValue(undefined);

const logger = useTestLogger();

describe("Queue teardown", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the guild",
			logger,
			reply: mockReply,
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
