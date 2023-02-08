import "../../../tests/testUtils/leakedHandles.js";

jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useGuildStorage");

import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as jest.Mock;
const mockSetQueueOpen = setQueueOpen as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext.js";
import { open } from "./open.js";

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockFollowUp = jest.fn().mockResolvedValue(undefined);
const mockChannelSend = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

describe("Open the Queue", () => {
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
				reply: false
			})
		);
	});
});
