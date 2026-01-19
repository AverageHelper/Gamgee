import { beforeEach, describe, expect, it } from "vitest";
import { channelMention, userMention } from "discord.js";
import {
	requireEnv,
	setIsQueueAdmin,
	setIsQueueCreator,
	commandResponseInTestChannel,
	sendCommand,
	waitForMessage,
	sendMessageWithDefaultClient,
	sendCommandWithDefaultClient,
	useTesterClient,
} from "./discordUtils/index.js";

const UUT_ID = requireEnv("BOT_TEST_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "quo";

describe("Command as admin", () => {
	const url = "https://youtu.be/dQw4w9WgXcQ";
	const info = `Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster): (3 minutes, 34 seconds)`;
	const NO_QUEUE = "no queue";
	const NEW_QUEUE = "New queue";

	beforeEach(async () => {
		// Cut out the test filepath
		const title = expect.getState().currentTestName?.split(" > ").slice(1).join(" > ");
		await sendMessageWithDefaultClient(`**'${title ?? "null"}'**`);

		await setIsQueueCreator(true);
		await commandResponseInTestChannel(`${QUEUE_COMMAND} teardown`, "deleted");

		// Add the Queue Admin role to the tester bot
		await setIsQueueCreator(false);
		await setIsQueueAdmin(true);
	});

	describe("unknown input", () => {
		it("does nothing", async () => {
			const content = await commandResponseInTestChannel("dunno what this does");
			expect(content).toBeNull();
		});
	});

	describe("queue", () => {
		describe("when the queue is set up", () => {
			beforeEach(async () => {
				await setIsQueueCreator(true);
				await commandResponseInTestChannel(
					`${QUEUE_COMMAND} setup ${channelMention(QUEUE_CHANNEL_ID)}`,
					NEW_QUEUE,
				);
				await commandResponseInTestChannel(
					`${QUEUE_COMMAND} whitelist ${userMention(UUT_ID)}`,
					"is allowed",
				);
			});

			{
				const keys = [
					"entry-duration-max", //
					"cooldown",
					"count",
				];
				for (const key of keys) {
					it(`allows the tester to set ${key} limits on the queue`, async () => {
						const content = await commandResponseInTestChannel(`${QUEUE_COMMAND} limit ${key} 3`);
						expect(content).toBeTruthy();
						expect(content?.toLowerCase()).toContain(`set to **3`);
					});
				}
			}

			it("can manage the blacklist", async () => {
				// read blacklist, should be empty
				const firstCheck = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist`,
					"Song Request Blacklist for",
				);
				expect(firstCheck).toBeTruthy();
				expect(firstCheck).toContain("Nobody");

				// add to blacklist
				const firstAdd = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist ${userMention(UUT_ID)}`,
					"is no longer allowed",
				);
				expect(firstAdd).toBeTruthy();
				expect(firstAdd).toContain(`<@!${UUT_ID}> is no longer allowed`);

				// read blacklist, should contain user
				const secondCheck = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist`,
					"Song Request Blacklist for",
				);
				expect(secondCheck).toBeTruthy();
				expect(secondCheck).toContain(userMention(UUT_ID));

				// add to blacklist again, should have no duplicates
				const secondAdd = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist ${userMention(UUT_ID)}`,
					"is no longer allowed",
				);
				expect(secondAdd).toBeTruthy();
				expect(secondAdd).toContain(`<@!${UUT_ID}> is no longer allowed`);

				const thirdCheck = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist`,
					"Song Request Blacklist for",
				);
				expect(thirdCheck).toBeTruthy();
				expect(thirdCheck).toContain(
					userMention(UUT_ID), // TODO: Make sure this is the only match
				);

				// remove from blacklist
				const remove = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} whitelist ${userMention(UUT_ID)}`,
					"is allowed",
				);
				expect(remove).toBeTruthy();
				expect(remove).toContain(`<@!${UUT_ID}> is allowed`);

				// read blacklist, should be empty again
				const fourthCheck = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} blacklist`,
					"Song Request Blacklist for",
				);
				expect(fourthCheck).toBeTruthy();
				expect(fourthCheck).toContain("Nobody");
			});

			it("removes a user from the blacklist when the blacklist was already empty", async () => {
				const expected = "is allowed to submit song requests";
				const content = await commandResponseInTestChannel(
					`${QUEUE_COMMAND} whitelist ${userMention(UUT_ID)}`,
					expected,
				);
				expect(content).toBeTruthy();
				expect(content).toContain(expected);
			});
		});

		describe("when the queue is not set up", () => {
			const NO_QUEUE = "no queue";

			it("url request does nothing", async () => {
				const content = await commandResponseInTestChannel(`sr ${url}`, NO_QUEUE);
				expect(content).toBeTruthy();
				expect(content?.toLowerCase()).toContain(NO_QUEUE);
			});

			it("url request with embed hidden does nothing", async () => {
				const content = await commandResponseInTestChannel(`sr <${url}>`, NO_QUEUE);
				expect(content).toBeTruthy();
				expect(content?.toLowerCase()).toContain(NO_QUEUE);
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

			it("fails to set up a queue without a channel mention", async () => {
				await setIsQueueCreator(true);
				await useTesterClient(async client => {
					const cmdMessage = await sendCommand(client, `${QUEUE_COMMAND} setup`);
					const response = await waitForMessage(
						msg => msg.author.id === UUT_ID && msg.channel.id === cmdMessage.channel.id,
					);
					expect(response?.content).toBeTruthy();
					expect(response?.content).toContain("name a text channel");
				});
			});

			{
				const keys = [
					"entry-duration-max", //
					"cooldown",
					"count",
				];
				for (const key of keys) {
					it(`fails to set ${key} limits on the queue`, async () => {
						const content = await commandResponseInTestChannel(`${QUEUE_COMMAND} limit ${key} 3`);
						expect(content).toBeTruthy();
						expect(content?.toLowerCase()).toContain(NO_QUEUE);
					});
				}
			}

			{
				const keys = [
					"entry-duration-max", //
					"cooldown",
					"count",
				];
				for (const key of keys) {
					it(`allows the tester to get the queue's global ${key} limit`, async () => {
						const content = await commandResponseInTestChannel(`${QUEUE_COMMAND} limit ${key}`);
						expect(content).toBeTruthy();
						expect(content?.toLowerCase()).toContain(NO_QUEUE);
					});
				}
			}

			it("allows the tester to set up a queue", async () => {
				await setIsQueueCreator(true);
				await sendCommandWithDefaultClient(
					`${QUEUE_COMMAND} setup ${channelMention(QUEUE_CHANNEL_ID)}`,
				);
				const response = await waitForMessage(
					msg => msg.author.id === UUT_ID && msg.channel.id === QUEUE_CHANNEL_ID,
				);
				expect(response?.content).toBeTruthy();
				expect(response?.content).toContain("This is a queue now.");
			});
		});
	});

	describe("video", () => {
		const needSongLink = `You're gonna have to add a song link to that.`;

		it("asks for a song link", async () => {
			const content = await commandResponseInTestChannel("video", needSongLink);
			expect(content).toBe(needSongLink);
		});

		it("returns the title and duration of a song with normal spacing", async () => {
			const content = await commandResponseInTestChannel(`video ${url}`, info);
			expect(content).toBe(info);
		});

		it("returns the title and duration of a song with suboptimal spacing", async () => {
			const content = await commandResponseInTestChannel(`video             ${url}`, info);
			expect(content).toBe(info);
		});

		it("returns the title and duration of a song with embed hidden", async () => {
			const content = await commandResponseInTestChannel(`video <${url}>`, info);
			expect(content).toBe(info);
		});
	});
});
