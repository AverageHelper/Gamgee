import "../../tests/testUtils/leakedHandles.js";

jest.mock("../useQueueStorage.js");
jest.mock("../actions/queue/getQueueChannel.js");
jest.mock("../useGuildStorage.js");

import {
	countAllStoredEntriesFromSender,
	getLatestStoredEntryFromSender,
	getStoredQueueConfig
} from "../useQueueStorage.js";
const mockCountAllStoredEntriesFromSender = countAllStoredEntriesFromSender as jest.Mock;
const mockGetStoredQueueConfig = getStoredQueueConfig as jest.Mock;
const mockGetLatestStoredEntryFromSender = getLatestStoredEntryFromSender as jest.Mock;

import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { isQueueOpen } from "../useGuildStorage.js";
const mockIsQueueOpen = isQueueOpen as jest.Mock;

import type { GuildedCommandContext } from "./CommandContext.js";
import { cooldown } from "./cooldown.js";

const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);

describe("User retrieving their own cooldown", () => {
	let context: GuildedCommandContext;
	const cooldownSeconds = 120;

	beforeAll(() => {
		jest.useFakeTimers();
	});

	beforeEach(() => {
		jest.setSystemTime(Date.UTC(2021, 3, 14, 11, 24)); // 2021-03-14 11:24, date of first commit to Gamgee ^^

		context = {
			guild: "the-guild",
			user: { id: "the-user" },
			deleteInvocation: mockDeleteInvocation,
			replyPrivately: mockReplyPrivately
		} as unknown as GuildedCommandContext;

		mockGetQueueChannel.mockResolvedValue({
			id: "queue-channel"
		});
		mockGetStoredQueueConfig.mockResolvedValue({
			blacklistedUsers: [],
			cooldownSeconds,
			entryDurationMaxSeconds: null,
			entryDurationMinSeconds: null,
			submissionMaxQuantity: null
		});
		mockCountAllStoredEntriesFromSender.mockResolvedValue(0);
		mockGetLatestStoredEntryFromSender.mockResolvedValue(null);
		mockIsQueueOpen.mockResolvedValue(true);
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test("tells the user when the queue is not set up", async () => {
		mockGetQueueChannel.mockResolvedValue(null);
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith("No queue is set up.");
	});

	test("tells the user when they're blacklisted", async () => {
		mockGetStoredQueueConfig.mockResolvedValue({
			blacklistedUsers: [context.user]
		});
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(
			"You can submit once you're removed from the blacklist... sorry"
		);
	});

	test("tells the user when the queue is closed", async () => {
		mockIsQueueOpen.mockResolvedValue(false);
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith("The queue is not open.");
	});

	test("tells the user they can submit immediately when there's no cooldown", async () => {
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith("You can submit right now! :grinning:");
	});

	test.each`
		userSubmissions | submissionMaxQuantity
		${0}            | ${0}
		${1}            | ${0}
		${1}            | ${1}
		${2}            | ${1}
		${2}            | ${2}
		${3}            | ${2}
		${3}            | ${3}
		${4}            | ${3}
		${4}            | ${4}
	`(
		"the user cannot submit if they've hit the submission count limit (submitted $userSubmissions, max $submissionMaxQuantity)",
		async ({
			userSubmissions,
			submissionMaxQuantity
		}: {
			userSubmissions: number;
			submissionMaxQuantity: number;
		}) => {
			mockCountAllStoredEntriesFromSender.mockResolvedValue(userSubmissions);
			mockGetLatestStoredEntryFromSender.mockResolvedValue({
				queueMessageId: "message-1",
				url: "https://example.com",
				seconds: 500,
				sentAt: new Date(Date.UTC(2021, 3, 14, 11, 21)),
				senderId: context.user.id,
				isDone: false
			});
			mockGetStoredQueueConfig.mockResolvedValue({
				cooldownSeconds,
				entryDurationMaxSeconds: null,
				submissionMaxQuantity,
				blacklistedUsers: []
			});
			await cooldown.execute(context);
			expect(mockReplyPrivately).toHaveBeenCalledOnce();

			let quantity: string;
			if (userSubmissions <= 0) {
				quantity = "all of your submissions";
			} else if (userSubmissions === 1) {
				quantity = "your only submission";
			} else if (userSubmissions === 2) {
				quantity = "both of your submissions";
			} else {
				quantity = `all ${userSubmissions} of your submissions`;
			}

			expect(mockReplyPrivately).toHaveBeenCalledWith(
				`You've used ${quantity} for the night! :tada:`
			);
		}
	);

	test.each`
		userSubmissions | submissionMaxQuantity
		${0}            | ${1}
		${0}            | ${2}
		${1}            | ${2}
		${0}            | ${3}
		${1}            | ${3}
		${2}            | ${3}
		${0}            | ${4}
		${1}            | ${4}
		${2}            | ${4}
		${3}            | ${4}
	`(
		"the user can submit immediately if they've hit not the submission count limit yet (submitted $userSubmissions, max $submissionMaxQuantity)",
		async ({
			userSubmissions,
			submissionMaxQuantity
		}: {
			userSubmissions: number;
			submissionMaxQuantity: number;
		}) => {
			mockCountAllStoredEntriesFromSender.mockResolvedValue(userSubmissions);
			mockGetLatestStoredEntryFromSender.mockResolvedValue({
				queueMessageId: "message-1",
				url: "https://example.com",
				seconds: 500,
				sentAt: new Date(Date.UTC(2021, 3, 14, 11, 21)),
				senderId: context.user.id,
				isDone: false
			});
			mockGetStoredQueueConfig.mockResolvedValue({
				cooldownSeconds,
				entryDurationMaxSeconds: null,
				submissionMaxQuantity,
				blacklistedUsers: []
			});
			await cooldown.execute(context);
			expect(mockReplyPrivately).toHaveBeenCalledOnce();
			expect(mockReplyPrivately).toHaveBeenCalledWith("You can submit right now! :grinning:");
		}
	);

	// User sees their cooldown wait time, stays where it's at during re-invocations, but the time remaining ticks down
	test("cooldown wait time is formatted correctly after multiple invocations", async () => {
		const submissionMaxQuantity = 3;
		const userSubmissions = 1;
		const absolute = "1618399560";
		let relative = "2 minutes";
		mockGetStoredQueueConfig.mockResolvedValue({
			cooldownSeconds,
			entryDurationMaxSeconds: null,
			submissionMaxQuantity,
			blacklistedUsers: []
		});
		mockCountAllStoredEntriesFromSender.mockResolvedValue(userSubmissions);
		mockGetLatestStoredEntryFromSender.mockResolvedValue({
			queueMessageId: "message-1",
			url: "https://example.com",
			seconds: 500,
			sentAt: new Date(),
			senderId: context.user.id,
			isDone: false
		});

		// First invocation, just submitted a song
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(
			`You may submit in **${relative}**, at <t:${absolute}:T> local time`
		);

		// Second invocation, getting antsy (absolute time remains the same)
		mockReplyPrivately.mockClear();
		jest.setSystemTime(Date.UTC(2021, 3, 14, 11, 24, 10));
		relative = "1 minute, 50 seconds";
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(
			`You may submit in **${relative}**, at <t:${absolute}:T> local time`
		);

		// Third invocation, waited a while (absolute time remains the same)
		mockReplyPrivately.mockClear();
		jest.setSystemTime(Date.UTC(2021, 3, 14, 11, 25, 10));
		relative = "50 seconds";
		await cooldown.execute(context);
		expect(mockReplyPrivately).toHaveBeenCalledOnce();
		expect(mockReplyPrivately).toHaveBeenCalledWith(
			`You may submit in **${relative}**, at <t:${absolute}:T> local time`
		);
	});
});
