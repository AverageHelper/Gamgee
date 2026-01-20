import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../useGuildStorage.js");

import { setQueueChannel } from "../../useGuildStorage.js";
const mockSetQueueChannel = setQueueChannel as Mock<typeof setQueueChannel>;

import type { GuildedCommandContext } from "../Command.js";
import { teardown } from "./teardown.js";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

const mockReply = vi.fn<GuildedCommandContext["reply"]>().mockResolvedValue(undefined);

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
		expect(mockReply).toHaveBeenCalledExactlyOnceWith("Queue deleted.");
		expect(mockSetQueueChannel).toHaveBeenCalledExactlyOnceWith(null, context.guild);
	});
});
