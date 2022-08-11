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

describe("Command as pleb", function () {
	const url = "https://youtu.be/dQw4w9WgXcQ";

	beforeEach(async function () {
		const title = this.test?.titlePath().join(" - ");
		await sendMessageWithDefaultClient(`**'${title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

		// Remove the Queue Admin role from the tester bot
		await setIsQueueAdmin(false);
		await setIsQueueCreator(false);
	});

	describe("unknown input", function () {
		it("does nothing", async function () {
			const content = await commandResponseInTestChannel("dunno what this does");
			expect(content).to.be.null;
		});
	});

	describe("queue", function () {
		describe("when the queue is not set up", function () {
			it("url request does nothing", async function () {
				const content = await commandResponseInTestChannel(`sr ${url}`, "no queue");
				expect(content?.toLowerCase()).to.contain("no queue");
			});
		});

		const args = [
			{ isOpen: true, state: "open" }, //
			{ isOpen: false, state: "closed" }
		];
		for (const { isOpen, state } of args) {
			describe(`when the queue is ${state}`, function () {
				beforeEach(async function () {
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
					it("accepts a song request", async function () {
						const content = await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// TODO: Check that the request appears in the queue as well
						expect(content).to.contain(`Submission Accepted!`);
					});

					it("`sr` alone provides info on how to use the request command", async function () {
						const content = await commandResponseInTestChannel("sr", "To submit a song, type");
						expect(content).to.contain("To submit a song, type");
					});
				} else {
					it("url request tells the user the queue is not open", async function () {
						const content = await commandResponseInTestChannel(`sr ${url}`, "queue is not open");
						expect(content).to.contain("queue is not open");
					});
				}
			});
		}
	});

	describe("video", function () {
		const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;
		const needSongLink = `You're gonna have to add a song link to that.`;

		it("asks for a song link", async function () {
			const content = await commandResponseInTestChannel("video", needSongLink);
			expect(content).to.contain(needSongLink);
		});

		it("returns the title and duration of a song with normal spacing", async function () {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expect(content).to.contain(info);
		});

		it("returns the title and duration of a song with suboptimal spacing", async function () {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expect(content).to.contain(info);
		});
	});
});
