jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useGuildStorage");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as jest.Mock;
const mockSetQueueOpen = setQueueOpen as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext.js";
import { close } from "./close.js";

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockFollowUp = jest.fn().mockResolvedValue(undefined);
const mockChannelSend = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

describe("Close the Queue", () => {
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the-guild",
			channel: undefined,
			reply: mockReply,
			deleteInvocation: mockDeleteInvocation,
			followUp: mockFollowUp
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel",
			send: mockChannelSend
		});
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
		expect(mockIsQueueOpen).toHaveBeenCalledTimes(1);
		expect(mockSetQueueOpen).not.toHaveBeenCalled();
		expect(mockChannelSend).not.toHaveBeenCalled();
	});

	test("closes the queue when the queue exists and is open", async () => {
		mockIsQueueOpen.mockResolvedValue(true);
		await expect(close.execute(context)).resolves.toBeUndefined();
		expect(mockIsQueueOpen).toHaveBeenCalledTimes(1);
		expect(mockSetQueueOpen).toHaveBeenCalledTimes(1);
		expect(mockSetQueueOpen).toHaveBeenCalledWith(false, context.guild);
		expect(mockChannelSend).toHaveBeenCalledTimes(1);

		expect(mockChannelSend).toHaveBeenCalledWith(expect.stringContaining("is closed"));
		expect(mockFollowUp).toHaveBeenCalledWith(
			expect.objectContaining({
				content: expect.stringContaining("now closed") as string,
				reply: false
			})
		);
	});
});
