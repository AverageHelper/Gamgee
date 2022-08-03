import { requireEnv } from "../src/helpers/environment.js";
import {
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInSameChannel,
	sendMessageWithDefaultClient
} from "./discordUtils/index.js";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as pleb", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";

	beforeEach(async () => {
		await sendMessageWithDefaultClient(`**'${expect.getState().currentTestName}'**`);

		await setIsQueueCreator(true);
		await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`, undefined, "deleted");

		// Remove the Queue Admin role from the tester bot
		await setIsQueueAdmin(false);
		await setIsQueueCreator(false);
	});

	describe("unknown input", () => {
		test("does nothing", async () => {
			const content = await commandResponseInSameChannel("dunno what this does");
			expect(content).toBeNull();
		});
	});

	describe("queue", () => {
		describe("when the queue is not set up", () => {
			test("url request does nothing", async () => {
				const content = await commandResponseInSameChannel(`sr ${url}`, undefined, "no queue");
				expect(content?.toLowerCase()).toContain("no queue");
			});
		});

		describe.each`
			isOpen   | state
			${true}  | ${"open"}
			${false} | ${"closed"}
		`("when the queue is $state", ({ isOpen }: { isOpen: boolean }) => {
			beforeEach(async () => {
				await sendMessageWithDefaultClient(`**Setup**`);
				await setIsQueueCreator(true);
				await setIsQueueAdmin(true);
				await commandResponseInSameChannel(
					`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`,
					undefined,
					"set up"
				);

				if (isOpen) {
					await commandResponseInSameChannel(`${QUEUE_COMMAND} open`);
				} else {
					await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
				}

				await setIsQueueCreator(false);
				await setIsQueueAdmin(false);
				await sendMessageWithDefaultClient(`**Run**`);
			});

			if (isOpen) {
				test("accepts a song request", async () => {
					const content = await commandResponseInSameChannel(
						`sr ${url}`,
						undefined,
						"Submission Accepted!"
					);

					// TODO: Check that the request appears in the queue as well
					expect(content).toContain(`Submission Accepted!`);
				});

				test("`sr` alone provides info on how to use the request command", async () => {
					const content = await commandResponseInSameChannel(
						"sr",
						undefined,
						"To submit a song, type"
					);
					expect(content).toContain("To submit a song, type");
				});
			} else {
				test("url request tells the user the queue is not open", async () => {
					const content = await commandResponseInSameChannel(
						`sr ${url}`,
						undefined,
						"queue is not open"
					);
					expect(content).toContain("queue is not open");
				});
			}
		});
	});

	describe("video", () => {
		const info = `Rick Astley - Never Gonna Give You Up (Official Music Video): (3 minutes, 33 seconds)`;
		const needSongLink = `You're gonna have to add a song link to that.`;

		test("asks for a song link", async () => {
			const content = await commandResponseInSameChannel("video", undefined, needSongLink);
			expect(content).toContain(needSongLink);
		});

		test("returns the title and duration of a song with normal spacing", async () => {
			const content = await commandResponseInSameChannel(`video ${url}`, undefined, info);
			expect(content).toContain(info);
		});

		test("returns the title and duration of a song with suboptimal spacing", async () => {
			const content = await commandResponseInSameChannel(
				`video             ${url}`,
				undefined,
				info
			);
			expect(content).toContain(info);
		});
	});
});
