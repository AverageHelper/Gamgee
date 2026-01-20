import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../actions/queue/getQueueChannel.js");
vi.mock("../../useGuildStorage.js");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as Mock<typeof isQueueOpen>;
const mockSetQueueOpen = setQueueOpen as Mock<typeof setQueueOpen>;

import type { GuildedCommandContext } from "../CommandContext.js";
import type { TextChannel } from "discord.js";
import { close } from "./close.js";

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockFollowUp = vi.fn().mockResolvedValue(undefined);
const mockChannelSend = vi.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = vi.fn().mockResolvedValue(undefined);

describe("Close the Queue", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the-guild",
			channel: undefined,
			reply: mockReply,
			deleteInvocation: mockDeleteInvocation,
			followUp: mockFollowUp,
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel",
			send: mockChannelSend,
		} as unknown as TextChannel);
		mockIsQueueOpen.mockResolvedValue(false);
		mockSetQueueOpen.mockResolvedValue(undefined);
	});

	test("cannot close without a queue in the guild", async () => {
		mockGetQueueChannel.mockResolvedValue(null);
		await expect(close.execute(context)).resolves.toBeUndefined();
		expect(mockSetQueueOpen).not.toHaveBeenCalled();
		expect(mockChannelSend).not.toHaveBeenCalled();
	});

	test("cannot close a queue when the queue is already closed", async () => {
		mockIsQueueOpen.mockResolvedValue(false);
		await expect(close.execute(context)).resolves.toBeUndefined();
		expect(mockIsQueueOpen).toHaveBeenCalledOnce();
		expect(mockSetQueueOpen).not.toHaveBeenCalled();
		expect(mockChannelSend).not.toHaveBeenCalled();
	});

	test("closes the queue when the queue exists and is open", async () => {
		mockIsQueueOpen.mockResolvedValue(true);
		await expect(close.execute(context)).resolves.toBeUndefined();
		expect(mockIsQueueOpen).toHaveBeenCalledOnce();
		expect(mockSetQueueOpen).toHaveBeenCalledExactlyOnceWith(false, context.guild);
		expect(mockChannelSend).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("is closed"));
		expect(mockFollowUp).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.stringContaining("now closed") as string,
				reply: false,
			}),
		);
	});
});
