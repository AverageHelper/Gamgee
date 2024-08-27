import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../actions/queue/useQueue.js");
vi.mock("../actions/queue/getQueueChannel.js");
vi.mock("../useQueueStorage.js");
vi.mock("../permissions/index.js");

import { addUserToHaveCalledNowPlaying } from "../actions/queue/useQueue.js";
const mockAddUserToHaveCalledNowPlaying = addUserToHaveCalledNowPlaying as Mock<
	typeof addUserToHaveCalledNowPlaying
>;

import { getAllStoredEntries } from "../useQueueStorage.js";
const mockGetAllStoredEntries = getAllStoredEntries as Mock<typeof getAllStoredEntries>;

import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as Mock<typeof getQueueChannel>;

mockGetAllStoredEntries.mockResolvedValue([]);

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockReplyWithMention = vi.fn().mockResolvedValue(undefined);
const mockReplyPrivately = vi.fn().mockResolvedValue(undefined);
const mockDeleteMessage = vi.fn().mockResolvedValue(undefined);
mockAddUserToHaveCalledNowPlaying.mockResolvedValue(undefined);

import { nowPlaying } from "./nowPlaying.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";
import type { GuildedCommandContext } from "./Command.js";
import type { QueueEntry } from "../useQueueStorage.js";
import type { TextChannel } from "discord.js";

const logger = useTestLogger();

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
			deleteInvocation: mockDeleteMessage,
		} as unknown as GuildedCommandContext;

		mockGetAllStoredEntries.mockResolvedValue([]);
		mockReplyWithMention.mockResolvedValue(undefined);
		mockReplyPrivately.mockResolvedValue(undefined);
		mockDeleteMessage.mockResolvedValue(undefined);
		mockGetQueueChannel.mockResolvedValue({ id: queueChannelId } as unknown as TextChannel);
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
			mockGetAllStoredEntries.mockResolvedValue(values);

			await expect(nowPlaying.execute(context)).resolves.toBeUndefined();

			expect(mockAddUserToHaveCalledNowPlaying).not.toHaveBeenCalled();
			expect(mockDeleteMessage).toHaveBeenCalledOnce();
			expect(mockReplyWithMention).not.toHaveBeenCalled();
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("nothing"));
		},
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
			mockGetAllStoredEntries.mockResolvedValue(values);
			mockGetQueueChannel.mockResolvedValue({
				messages: {
					fetch: vi.fn().mockResolvedValue({
						id: "queue message id",
						edit: vi.fn().mockResolvedValue(undefined),
					}),
				},
			} as unknown as TextChannel);

			await expect(nowPlaying.execute(context)).resolves.toBeUndefined();

			expect(mockAddUserToHaveCalledNowPlaying).toHaveBeenCalledOnce();
			expect(mockDeleteMessage).toHaveBeenCalledOnce();
			expect(mockReplyWithMention).not.toHaveBeenCalled();
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("first!"), true);
			expect(mockReplyPrivately).toHaveBeenCalledWith(expect.stringContaining("<@me>"), true);
		},
	);
});
