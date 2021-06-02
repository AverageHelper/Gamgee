jest.mock("./actions/messages");
jest.mock("./actions/queue/getQueueChannel");
jest.mock("./actions/queue/useQueue");
jest.mock("./helpers/getUserWithId");
jest.mock("./useGuildStorage");

import { sendPrivately } from "./actions/messages";
const mockSendPrivately = sendPrivately as jest.Mock;

import getQueueChannel from "./actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueue } from "./actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import { getUserWithId } from "./helpers/getUserWithId";
const mockGetUserWithId = getUserWithId as jest.Mock;

import { useGuildStorage } from "./useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

const mockIsQueueOpen = jest.fn();
const mockMarkDone = jest.fn().mockResolvedValue(undefined);
const mockMarkNotDone = jest.fn().mockResolvedValue(undefined);
const mockDeleteEntryFromMessage = jest.fn().mockResolvedValue(undefined);

import type Discord from "discord.js";
import { handleReactionAdd } from "./handleReactionAdd";
import { REACTION_BTN_DELETE, REACTION_BTN_DONE, REACTION_BTN_UNDO } from "./constants/reactions";
import { useTestLogger } from "../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Reaction-add handler", () => {
	const guildId = "the-guild";
	const selfId = "this-bot";
	const senderId = "a-user";
	const queueChannelId = "queue-channel";
	const entrySenderId = "some-user";
	const entryUrl = "the-entry-url";

	const entry = {
		queueMessageId: "some-particular-message",
		isDone: false,
		senderId: entrySenderId,
		url: entryUrl
	};
	let reaction: Discord.MessageReaction;
	let sender: Discord.User;

	beforeEach(() => {
		reaction = ({
			client: {
				user: {
					id: selfId
				}
			},
			message: {
				guild: {
					id: guildId
				},
				channel: {
					id: queueChannelId
				}
			},
			emoji: {
				name: ":face_with_monocle:"
			}
		} as unknown) as Discord.MessageReaction;
		sender = ({
			bot: false,
			id: senderId
		} as unknown) as Discord.User;

		mockDeleteEntryFromMessage.mockResolvedValue(entry);
		mockGetQueueChannel.mockResolvedValue({
			id: queueChannelId
		});
		mockGetUserWithId.mockImplementation((guild: Discord.Guild, userId: string) => {
			return Promise.resolve({ id: userId });
		});
		mockUseQueue.mockReturnValue({
			getEntryFromMessage: jest.fn().mockResolvedValue(entry),
			markDone: mockMarkDone,
			markNotDone: mockMarkNotDone,
			deleteEntryFromMessage: mockDeleteEntryFromMessage
		});
		mockUseGuildStorage.mockReturnValue({
			isQueueOpen: mockIsQueueOpen
		});
		mockIsQueueOpen.mockResolvedValue(true);
	});

	test("extra emote triggers no action", async () => {
		await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

		expect(mockMarkDone).not.toHaveBeenCalled();
		expect(mockMarkNotDone).not.toHaveBeenCalled();
		expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
	});

	test("Done button triggers mark-done action", async () => {
		reaction.emoji.name = REACTION_BTN_DONE;
		await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

		expect(mockMarkDone).toHaveBeenCalledTimes(1);
		expect(mockMarkNotDone).not.toHaveBeenCalled();
		expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
	});

	test("Undo button triggers mark-not-done action", async () => {
		reaction.emoji.name = REACTION_BTN_UNDO;
		await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

		expect(mockMarkNotDone).toHaveBeenCalledTimes(1);
		expect(mockMarkDone).not.toHaveBeenCalled();
		expect(mockDeleteEntryFromMessage).not.toHaveBeenCalled();
	});

	describe.each`
		isQueueOpen | desc
		${true}     | ${"open"}
		${false}    | ${"closed"}
	`("when queue is $desc", ({ isQueueOpen }: { isQueueOpen: boolean }) => {
		beforeEach(() => {
			mockIsQueueOpen.mockResolvedValue(isQueueOpen);
		});

		test("Delete button triggers delete action", async () => {
			reaction.emoji.name = REACTION_BTN_DELETE;
			await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

			expect(mockDeleteEntryFromMessage).toHaveBeenCalledTimes(1);
			expect(mockMarkDone).not.toHaveBeenCalled();
			expect(mockMarkNotDone).not.toHaveBeenCalled();
		});

		test("Delete button informs the entry's sender that their submission was rejected", async () => {
			reaction.emoji.name = REACTION_BTN_DELETE;
			await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

			// Sends a proper response to the user
			const entrySender = { id: entrySenderId };
			expect(mockSendPrivately).toHaveBeenCalledTimes(isQueueOpen ? 2 : 1);
			expect(mockSendPrivately).toHaveBeenNthCalledWith(
				1,
				entrySender,
				expect.stringContaining("sorry")
			);
			expect(mockSendPrivately).toHaveBeenNthCalledWith(
				1,
				entrySender,
				expect.stringContaining("rejected")
			);
			expect(mockSendPrivately).toHaveBeenNthCalledWith(
				1,
				entrySender,
				expect.stringContaining(entryUrl)
			);
		});

		if (isQueueOpen)
			test("Delete button informs the entry's sender that they may submit another song", async () => {
				reaction.emoji.name = REACTION_BTN_DELETE;
				await expect(handleReactionAdd(reaction, sender, logger)).resolves.toBeUndefined();

				const entrySender = { id: entrySenderId };
				expect(mockSendPrivately).toHaveBeenCalledTimes(2);

				// If queue is open
				expect(mockSendPrivately).toHaveBeenNthCalledWith(
					2,
					entrySender,
					expect.stringContaining("resubmit")
				);
			});
	});
});
