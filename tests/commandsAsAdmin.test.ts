import { expect } from "chai";
import { requireEnv } from "../src/helpers/environment.js";
import {
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendCommand,
	waitForMessage,
	sendMessageWithDefaultClient,
	sendCommandWithDefaultClient,
	useTesterClient
} from "./discordUtils/index.js";

const UUT_ID = requireEnv("BOT_TEST_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as admin", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";
	const NO_QUEUE = "no queue";

	beforeEach(async function beforeEach() {
		await sendMessageWithDefaultClient(`**'${this.currentTest?.title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

		// Add the Queue Admin role to the tester bot
		await setIsQueueCreator(false);
		await setIsQueueAdmin(true);
	});

	describe("unknown input", () => {
		test("does nothing", async () => {
			const content = await commandResponseInTestChannel("dunno what this does");
			expect(content).to.be.null;
		});
	});

	describe("queue", () => {
		describe("when the queue is not set up", () => {
			const NO_QUEUE = "no queue";

			test("url request does nothing", async () => {
				const content = await commandResponseInTestChannel(`sr ${url}`, NO_QUEUE);
				expect(content?.toLowerCase()).to.contain(NO_QUEUE);
			});
		});

		describe("no queue yet", () => {
			beforeEach(async () => {
				await sendMessageWithDefaultClient(`**Setup**`);
				await setIsQueueCreator(true);
				await setIsQueueAdmin(true);

				await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

				await setIsQueueCreator(false);
				await sendMessageWithDefaultClient(`**Run**`);
			});

			test("fails to set up a queue without a channel mention", async () => {
				await setIsQueueCreator(true);
				await useTesterClient(async client => {
					const cmdMessage = await sendCommand(client, `${QUEUE_COMMAND} setup`);
					const response = await waitForMessage(
						msg => msg.author.id === UUT_ID && msg.channel.id === cmdMessage.channel.id
					);
					expect(response?.content).to.contain("name a text channel");
				});
			});

			[
				"entry-duration", //
				"cooldown",
				"count"
			].forEach(key => {
				test(`fails to set ${key} limits on the queue`, async () => {
					const content = await commandResponseInTestChannel(`${QUEUE_COMMAND} limit ${key} 3`);
					expect(content?.toLowerCase()).to.contain(NO_QUEUE);
				});
			});

			[
				"entry-duration", //
				"cooldown",
				"count"
			].forEach(key => {
				test(`allows the tester to get the queue's global ${key} limit`, async () => {
					const content = await commandResponseInTestChannel(`${QUEUE_COMMAND} limit ${key}`);
					expect(content?.toLowerCase()).to.contain(NO_QUEUE);
				});
			});

			test("allows the tester to set up a queue", async () => {
				await setIsQueueCreator(true);
				await sendCommandWithDefaultClient(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);
				const response = await waitForMessage(
					msg => msg.author.id === UUT_ID && msg.channel.id === QUEUE_CHANNEL_ID
				);
				expect(response?.content).to.contain("This is a queue now.");
			});
		});
	});

	describe("video", () => {
		const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;
		const needSongLink = `You're gonna have to add a song link to that.`;

		test("asks for a song link", async () => {
			const content = await commandResponseInTestChannel("video", needSongLink);
			expect(content).to.be.string(needSongLink);
		});

		test("returns the title and duration of a song with normal spacing", async () => {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expect(content).to.be.string(info);
		});

		test("returns the title and duration of a song with suboptimal spacing", async () => {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expect(content).to.be.string(info);
		});
	});
});
