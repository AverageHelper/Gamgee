jest.mock("../actions/queue/useQueue");
jest.mock("../actions/queue/getQueueChannel");
jest.mock("../useQueueStorage");
jest.mock("../permissions");

import { fetchAllEntries } from "../useQueueStorage.js";
const mockGetAllEntries = fetchAllEntries as jest.Mock;

import { addUserToHaveCalledNowPlaying } from "../actions/queue/useQueue.js";
const mockAddUserToHaveCalledNowPlaying = addUserToHaveCalledNowPlaying as jest.Mock;

import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

mockGetAllEntries.mockResolvedValue(undefined);

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockReplyWithMention = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
mockAddUserToHaveCalledNowPlaying.mockResolvedValue(undefined);

import { nowPlaying } from "./nowPlaying.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";
import type { GuildedCommandContext } from "./Command.js";
import type { QueueEntry } from "../useQueueStorage.js";

const logger = useTestLogger("error");

describe("Now-Playing", () => {
	const queueChannelId = "queue-channel";
	let context: GuildedCommandContext;

	beforeEach(() => {
		context = {
			guild: "the guild",
			logger,
			user: { id: "the user" },
			reply: mockReply,
			replyPrivately: mockReplyPrivately,
			deleteInvocation: mockDeleteMessage
		} as unknown as GuildedCommandContext;

		mockGetAllEntries.mockResolvedValue([]);
		mockReplyWithMention.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
		mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
	});

	test("informs the user when no queue is set up", async () => {
		mockGetQueueChannel.mockResolvedValue(null);

		await expect(nowPlaying.execute(context)).resolves.toBeUndefined();

		expect(mockAddUserToHaveCalledNowPlaying).not.toHaveBeenCalled();
		expect(mockDeleteMessage).toHaveBeenCalledOnce();
		expect(mockReplyWithMention).not.toHaveBeenCalled();
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("no queue"));
	});

	test.each`
		values
		${[]}
		${[{ isDone: true }]}
		${[{ isDone: true }, { isDone: true }]}
		${[{ isDone: true }, { isDone: true }, { isDone: true }]}
	`(
		"informs the user if all entries are done or the queue is empty",
		async ({ values }: { values: Array<QueueEntry> }) => {
			mockGetAllEntries.mockResolvedValue(values);

			await expect(nowPlaying.execute(context)).resolves.toBeUndefined();

			expect(mockAddUserToHaveCalledNowPlaying).not.toHaveBeenCalled();
			expect(mockDeleteMessage).toHaveBeenCalledOnce();
			expect(mockReplyWithMention).not.toHaveBeenCalled();
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("nothing"));
		}
	);

	test.each`
		values
		${[{ isDone: false, url: "first!", senderId: "me" }]}
		${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: false }]}
		${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: false }, { isDone: false }]}
		${[{ isDone: true }, { isDone: false, url: "first!", senderId: "me" }, { isDone: false }]}
		${[{ isDone: true }, { isDone: true }, { isDone: false, url: "first!", senderId: "me" }]}
		${[{ isDone: false, url: "first!", senderId: "me" }, { isDone: true }, { isDone: false }]}
	`(
		"provides the URL of the most recent not-done song",
		async ({ values }: { values: Array<QueueEntry> }) => {
			mockGetAllEntries.mockResolvedValue(values);
			mockGetQueueChannel.mockResolvedValue({
				messages: {
					fetch: jest.fn().mockResolvedValue({
						id: "queue message id",
						edit: jest.fn().mockResolvedValue(undefined)
					})
				}
			});

			await expect(nowPlaying.execute(context)).resolves.toBeUndefined();

			expect(mockAddUserToHaveCalledNowPlaying).toHaveBeenCalledOnce();
			expect(mockDeleteMessage).toHaveBeenCalledOnce();
			expect(mockReplyWithMention).not.toHaveBeenCalled();
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("first!"), true);
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("<@me>"), true);
		}
	);
});
