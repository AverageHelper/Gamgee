import { requireEnv } from "../src/helpers/environment.js";
import {
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInSameChannel,
	sendCommand,
	waitForMessage,
	sendMessage
} from "./discordUtils/index.js";

const UUT_ID = requireEnv("BOT_TEST_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as admin", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";
	const NO_QUEUE = "no queue";

	beforeEach(async () => {
		await sendMessage(`**'${expect.getState().currentTestName}'**`);

		await setIsQueueCreator(true);
		await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`, undefined, "deleted");

		// Add the Queue Admin role to the tester bot
		await setIsQueueCreator(false);
		await setIsQueueAdmin(true);
	});

	describe("unknown input", () => {
		test("does nothing", async () => {
			const response = await commandResponseInSameChannel("dunno what this does");
			expect(response).toBeNull();
		});
	});

	describe("queue", () => {
		describe("when the queue is not set up", () => {
			const NO_QUEUE = "no queue";

			test("url request does nothing", async () => {
				const response = await commandResponseInSameChannel(`sr ${url}`, undefined, NO_QUEUE);
				expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
			});
		});

		describe("no queue yet", () => {
			beforeEach(async () => {
				await sendMessage(`**Setup**`);
				await setIsQueueCreator(true);
				await setIsQueueAdmin(true);

				await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`, undefined, "deleted");

				await setIsQueueCreator(false);
				await sendMessage(`**Run**`);
			});

			test("fails to set up a queue without a channel mention", async () => {
				await setIsQueueCreator(true);
				const cmdMessage = await sendCommand(`${QUEUE_COMMAND} setup`);
				const response = await waitForMessage(
					msg => msg.author.id === UUT_ID && msg.channel.id === cmdMessage.channel.id
				);
				// expect(cmdMessage.deleted).toBeTrue(); // FIXME: This should work tho
				expect(response?.content).toContain("name a text channel");
			});

			test.each`
				key
				${"entry-duration"}
				${"cooldown"}
				${"count"}
			`("fails to set $key limits on the queue", async ({ key }: { key: string }) => {
				const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} limit ${key} 3`);
				expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
			});

			test.each`
				key
				${"entry-duration"}
				${"cooldown"}
				${"count"}
			`(
				"allows the tester to get the queue's global $key limit",
				async ({ key }: { key: string }) => {
					const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} limit ${key}`);
					expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
				}
			);

			test("allows the tester to set up a queue", async () => {
				await setIsQueueCreator(true);
				await sendCommand(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);
				const response = await waitForMessage(
					msg => msg.author.id === UUT_ID && msg.channel.id === QUEUE_CHANNEL_ID
				);
				expect(response?.content).toContain("This is a queue now.");
			});
		});
	});

	describe("video", () => {
		const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;
		const needSongLink = `You're gonna have to add a song link to that.`;

		test("asks for a song link", async () => {
			const response = await commandResponseInSameChannel("video", undefined, needSongLink);
			expect(response?.content).toBe(needSongLink);
		});

		test("returns the title and duration of a song with normal spacing", async () => {
			const response = await commandResponseInSameChannel(`video ${url}`, undefined, info);
			expect(response?.content).toBe(info);
		});

		test("returns the title and duration of a song with suboptimal spacing", async () => {
			const response = await commandResponseInSameChannel(
				`video             ${url}`,
				undefined,
				info
			);
			expect(response?.content).toBe(info);
		});
	});
});
