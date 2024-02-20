import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useTestLogger } from "../../../tests/testUtils/logger.js";

vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useGuildStorage.js");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<
	Parameters<typeof getQueueChannel>,
	ReturnType<typeof getQueueChannel>
>;

import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as Mock<
	Parameters<typeof isQueueOpen>,
	ReturnType<typeof isQueueOpen>
>;
const mockSetQueueOpen = setQueueOpen as Mock<
	Parameters<typeof setQueueOpen>,
	ReturnType<typeof setQueueOpen>
>;

import type { GuildedCommandContext } from "../CommandContext.js";
import type { TextChannel } from "discord.js";
import { open } from "./open.js";

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockFollowUp = vi.fn().mockResolvedValue(undefined);
const mockChannelSend = vi.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = vi.fn().mockResolvedValue(undefined);

describe("Open the Queue", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the-guild",
			channel: undefined,
			logger: useTestLogger(),
			reply: mockReply,
			deleteInvocation: mockDeleteInvocation,
			followUp: mockFollowUp,
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel",
			send: mockChannelSend,
		} as unknown as TextChannel);
		mockIsQueueOpen.mockResolvedValue(true);
		mockSetQueueOpen.mockResolvedValue(undefined);
	});

	test("cannot open without a queue in the guild", async () => {
		mockGetQueueChannel.mockResolvedValue(null);
		await expect(open.execute(context)).resolves.toBeUndefined();
		expect(mockSetQueueOpen).not.toHaveBeenCalled();
		expect(mockChannelSend).not.toHaveBeenCalled();
	});

	test("cannot open a queue when the queue is already open", async () => {
		mockIsQueueOpen.mockResolvedValue(true);
		await expect(open.execute(context)).resolves.toBeUndefined();
		expect(mockIsQueueOpen).toHaveBeenCalledOnce();
		expect(mockSetQueueOpen).not.toHaveBeenCalled();
		expect(mockChannelSend).not.toHaveBeenCalled();
	});

	test("opens the queue when the queue exists and is closed", async () => {
		mockIsQueueOpen.mockResolvedValue(false);
		await expect(open.execute(context)).resolves.toBeUndefined();
		expect(mockIsQueueOpen).toHaveBeenCalledOnce();
		expect(mockSetQueueOpen).toHaveBeenCalledOnce();
		expect(mockSetQueueOpen).toHaveBeenCalledWith(true, context.guild);
		expect(mockChannelSend).toHaveBeenCalledOnce();

		expect(mockChannelSend).toHaveBeenCalledWith(expect.stringContaining("now open"));
		expect(mockFollowUp).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.stringContaining("now open") as string,
				reply: false,
			}),
		);
	});
});
