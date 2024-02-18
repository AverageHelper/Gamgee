import { channelMention } from "discord.js";
import { expectNull, expectToContain } from "./testUtils/expectations/chai.js";
import {
	requireEnv,
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendMessageWithDefaultClient
} from "./discordUtils/index.js";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as pleb", function () {
	const url = "https://youtu.be/dQw4w9WgXcQ";
	const fullUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
	const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;

	beforeEach(async function () {
		const title = this.test?.fullTitle();
		await sendMessageWithDefaultClient(`**'${title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await setIsQueueAdmin(true);
		await commandResponseInTestChannel(
			`${QUEUE_COMMAND} setup ${channelMention(QUEUE_CHANNEL_ID)}`,
			"set up"
		);
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
			{ isOpen: true, state: "open" },
			{ isOpen: false, state: "closed" }
		] as const;
		for (const { isOpen, state } of args) {
			describe(`when the queue is ${state}`, function () {
				beforeEach(async function () {
					await sendMessageWithDefaultClient(`**Setup**`);
					await setIsQueueCreator(true);
					await setIsQueueAdmin(true);
					await commandResponseInTestChannel(
						`${QUEUE_COMMAND} setup ${channelMention(QUEUE_CHANNEL_ID)}`,
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
					// TODO: Test blacklist behavior

					it("accepts a song request", async function () {
						const content = await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// TODO: Check that the request appears in the queue as well
						expectToContain(content, "Submission Accepted!");
					});

					it("accepts a song request with embed hidden", async function () {
						const content = await commandResponseInTestChannel(
							`sr <${url}>`,
							"Submission Accepted!"
						);

						// TODO: Check that the request appears in the queue as well
						expectToContain(content, "Submission Accepted!");
					});

					it("`sr` alone provides info on how to use the request command", async function () {
						const content = await commandResponseInTestChannel("sr", "To submit a song, use");
						expectToContain(content, "To submit a song, use");
					});

					it("`nowplaying` sends the track info to DMs", async function () {
						await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// This has had isues before, when the database doesn't know the user.
						// New users should always be able to run this command.
						// TODO: Have a second test robot run this command and see what happens. Sould succeed, but fail if we reintroduce the old bug
						const content = await commandResponseInTestChannel("nowplaying", "(DM to");
						expectToContain(content, fullUrl);
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
