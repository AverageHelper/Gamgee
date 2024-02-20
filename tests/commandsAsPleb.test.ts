import { beforeEach, describe, expect, it } from "vitest";
import { channelMention } from "discord.js";
import {
	requireEnv,
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendMessageWithDefaultClient
} from "./discordUtils/index.js";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as pleb", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";
	const fullUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
	const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;

	beforeEach(async () => {
		// Cut out the test filepath
		const title = expect.getState().currentTestName?.split(" > ").slice(1).join(" > ");
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

	describe("unknown input", () => {
		it("does nothing", async () => {
			const content = await commandResponseInTestChannel("dunno what this does");
			expect(content).toBeNull();
		});
	});

	describe("queue", () => {
		describe("when the queue is not set up", () => {
			it("url request does nothing", async () => {
				const content = await commandResponseInTestChannel(`sr ${url}`, "no queue");
				expect(content?.toLowerCase()).toContain("no queue");
			});
		});

		const args = [
			{ isOpen: true, state: "open" },
			{ isOpen: false, state: "closed" }
		] as const;
		for (const { isOpen, state } of args) {
			describe(`when the queue is ${state}`, () => {
				beforeEach(async () => {
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

					it("accepts a song request", async () => {
						const content = await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// TODO: Check that the request appears in the queue as well
						expect(content).toContain("Submission Accepted!");
					});

					it("accepts a song request with embed hidden", async () => {
						const content = await commandResponseInTestChannel(
							`sr <${url}>`,
							"Submission Accepted!"
						);

						// TODO: Check that the request appears in the queue as well
						expect(content).toContain("Submission Accepted!");
					});

					it("`sr` alone provides info on how to use the request command", async () => {
						const content = await commandResponseInTestChannel("sr", "To submit a song, use");
						expect(content).toContain("To submit a song, use");
					});

					it("`nowplaying` sends the track info to DMs", async () => {
						await commandResponseInTestChannel(`sr ${url}`, "Submission Accepted!");

						// This has had isues before, when the database doesn't know the user.
						// New users should always be able to run this command.
						// TODO: Have a second test robot run this command and see what happens. Sould succeed, but fail if we reintroduce the old bug
						const content = await commandResponseInTestChannel("nowplaying", "(DM to");
						expect(content).toContain(fullUrl);
					});
				} else {
					it("url request tells the user the queue is not open", async () => {
						const content = await commandResponseInTestChannel(`sr ${url}`, "queue is not open");
						expect(content).toContain("queue is not open");
					});

					it("url request tells the user the queue is not open even with embed hidden", async () => {
						const content = await commandResponseInTestChannel(`sr <${url}>`, "queue is not open");
						expect(content).toContain("queue is not open");
					});
				}
			});
		}
	});

	describe("video", () => {
		const needSongLink = `You're gonna have to add a song link to that.`;

		it("asks for a song link", async () => {
			const content = await commandResponseInTestChannel("video", needSongLink);
			expect(content).toContain(needSongLink);
		});

		it("returns the title and duration of a song with normal spacing", async () => {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expect(content).toContain(info);
		});

		it("returns the title and duration of a song with suboptimal spacing", async () => {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expect(content).toContain(info);
		});

		it("returns the title and duration of a song with embed hidden", async () => {
			const content = await commandResponseInTestChannel(`video <${url}>`, info);
			expect(content).toContain(info);
		});
	});
});
