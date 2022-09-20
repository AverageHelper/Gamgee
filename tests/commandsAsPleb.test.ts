import { expectNull, expectToContain } from "./testUtils/expectations/chai";
import {
	requireEnv,
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendMessageWithDefaultClient
} from "./discordUtils/index";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as pleb", function () {
	const url = "https://youtu.be/dQw4w9WgXcQ";

	beforeEach(async function () {
		const title = this.test?.fullTitle();
		await sendMessageWithDefaultClient(`**'${title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await setIsQueueAdmin(true);
		await commandResponseInTestChannel(`${QUEUE_COMMAND} restart`, "queue");
		await commandResponseInTestChannel(`${QUEUE_COMMAND} limit entry-duration-max 0`, "removed");
		await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

		// Remove the Queue Admin role from the tester bot
		await setIsQueueAdmin(false);
		await setIsQueueCreator(false);
	});

	describe("unknown input", function () {
		it("does nothing", async function () {
			const content = await commandResponseInTestChannel("dunno what this does");
			expectNull(content);
		});
	});

	describe("queue", function () {
		describe("when the queue is not set up", function () {
			it("url request does nothing", async function () {
				const content = await commandResponseInTestChannel(`sr ${url}`, "no queue");
				expectToContain(content?.toLowerCase(), "no queue");
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
						expectToContain(content, `Submission Accepted!`);
					});

					it("accepts a song request with embed hidden", async function () {
						const content = await commandResponseInTestChannel(
							`sr <${url}>`,
							"Submission Accepted!"
						);

						// TODO: Check that the request appears in the queue as well
						expectToContain(content, `Submission Accepted!`);
					});

					it("`sr` alone provides info on how to use the request command", async function () {
						const content = await commandResponseInTestChannel("sr", "To submit a song, type");
						expectToContain(content, "To submit a song, type");
					});
				} else {
					it("url request tells the user the queue is not open", async function () {
						const content = await commandResponseInTestChannel(`sr ${url}`, "queue is not open");
						expectToContain(content, "queue is not open");
					});

					it("url request tells the user the queue is not open even with embed hidden", async function () {
						const content = await commandResponseInTestChannel(`sr <${url}>`, "queue is not open");
						expectToContain(content, "queue is not open");
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
			expectToContain(content, needSongLink);
		});

		it("returns the title and duration of a song with normal spacing", async function () {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expectToContain(content, info);
		});

		it("returns the title and duration of a song with suboptimal spacing", async function () {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expectToContain(content, info);
		});

		it("returns the title and duration of a song with embed hidden", async function () {
			const content = await commandResponseInTestChannel(`video <${url}>`, info);
			expectToContain(content, info);
		});
	});
});
