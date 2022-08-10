import { expect } from "chai";
import { requireEnv } from "../src/helpers/environment.js";
import {
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendMessageWithDefaultClient
} from "./discordUtils/index.js";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as pleb", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";

	beforeEach(async function beforeEach() {
		await sendMessageWithDefaultClient(`**'${this.currentTest?.title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

		// Remove the Queue Admin role from the tester bot
		await setIsQueueAdmin(false);
		await setIsQueueCreator(false);
	});

	describe("unknown input", () => {
		test("does nothing", async () => {
			const content = await commandResponseInTestChannel("dunno what this does");
			expect(content).to.be.null;
		});
	});

	describe("queue", () => {
		describe("when the queue is not set up", () => {
			test("url request does nothing", async () => {
				const content = await commandResponseInTestChannel(`sr ${url}`, "no queue");
				expect(content?.toLowerCase()).to.contain("no queue");
			});
		});

		[
			{ isOpen: true, state: "open" }, //
			{ isOpen: false, state: "closed" }
		].forEach(({ isOpen, state }) => {
			describe(`when the queue is ${state}`, () => {
				beforeEach(async () => {
					await sendMessageWithDefaultClient(`**Setup**`);
					await setIsQueueCreator(true);
					await setIsQueueAdmin(true);
					await commandResponseInTestChannel(
						`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`,
						"set up"
					);

					if (isOpen) {
						await commandResponseInTestChannel(`${QUEUE_COMMAND} open`);
					} else {
						await commandResponseInTestChannel(`${QUEUE_COMMAND} close`);
					}

					await setIsQueueCreator(false);
					await setIsQueueAdmin(false);
					await sendMessageWithDefaultClient(`**Run**`);
				});

				if (isOpen) {
					test("accepts a song request", async () => {
						const content = await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// TODO: Check that the request appears in the queue as well
						expect(content).to.contain(`Submission Accepted!`);
					});

					test("`sr` alone provides info on how to use the request command", async () => {
						const content = await commandResponseInTestChannel("sr", "To submit a song, type");
						expect(content).to.contain("To submit a song, type");
					});
				} else {
					test("url request tells the user the queue is not open", async () => {
						const content = await commandResponseInTestChannel(`sr ${url}`, "queue is not open");
						expect(content).to.contain("queue is not open");
					});
				}
			});
		});
	});

	describe("video", () => {
		const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;
		const needSongLink = `You're gonna have to add a song link to that.`;

		test("asks for a song link", async () => {
			const content = await commandResponseInTestChannel("video", needSongLink);
			expect(content).to.contain(needSongLink);
		});

		test("returns the title and duration of a song with normal spacing", async () => {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expect(content).to.contain(info);
		});

		test("returns the title and duration of a song with suboptimal spacing", async () => {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expect(content).to.contain(info);
		});
	});
});
