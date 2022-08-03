import type { Client, Message, Snowflake } from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { useTesterClient } from "./testerClient.js";

const COMMAND_PREFIX = requireEnv("BOT_PREFIX");
const TEST_CHANNEL_ID: Snowflake = requireEnv("CHANNEL_ID");

/**
 * Instructs the tester bot to send a message in the provided channel.
 *
 * @param client The Discord client with which to send the message.
 * @param content The content of the message to send.
 * @param channelId The ID of the channel in which to send the message.
 *
 * @throws an error if the provided channel is not a text channel, or
 * something else went wrong with the send.
 *
 * @returns a `Promise` that resolves to the message that was sent.
 */
async function sendMessage(
	client: Client<true>,
	content: string,
	channelId: Snowflake = TEST_CHANNEL_ID
): Promise<Message> {
	const channel = await client.channels.fetch(channelId);
	if (!channel || !channel.isTextBased())
		throw new Error(`Channel ${channelId} is not a text channel.`);

	return await channel.send(content);
}

/**
 * Instructs the tester bot to send a message in the provided channel.
 *
 * @param content The content of the message to send.
 * @param channelId The ID of the channel in which to send the message.
 *
 * @throws an error if the provided channel is not a text channel, or
 * something else went wrong with the send.
 *
 * @returns a `Promise` that resolves to the message that was sent.
 */
export async function sendMessageWithDefaultClient(
	content: string,
	channelId: Snowflake = TEST_CHANNEL_ID
): Promise<void> {
	await useTesterClient(async client => {
		await sendMessage(client, content, channelId);
	});
}

/**
 * Instructs the tester bot to send a command message in the provided channel.
 * The command prefix for the bot unit under test (UUT) is automatically
 * prepended.
 *
 * @param name The name of the command to send, with the prefix omitted.
 * @param channelId The ID of the channel in which to send the command.
 *
 * @throws an error if the provided channel is not a text channel, or
 * something else went wrong with the send.
 *
 * @returns a `Promise` that resolves to the message that was sent.
 */
export async function sendCommandWithDefaultClient(
	name: string,
	channelId: Snowflake = TEST_CHANNEL_ID
): Promise<void> {
	await useTesterClient(async client => {
		await sendMessage(client, `${COMMAND_PREFIX}${name}`, channelId);
	});
}

/**
 * Instructs the tester bot to send a command message in the provided channel.
 * The command prefix for the bot unit under test (UUT) is automatically
 * prepended.
 *
 * @param client The Discord client with which to send the message.
 * @param name The name of the command to send, with the prefix omitted.
 * @param channelId The ID of the channel in which to send the command.
 *
 * @throws an error if the provided channel is not a text channel, or
 * something else went wrong with the send.
 *
 * @returns a `Promise` that resolves to the message that was sent.
 */
export async function sendCommand(
	client: Client<true>,
	name: string,
	channelId: Snowflake = TEST_CHANNEL_ID
): Promise<Message> {
	return await sendMessage(client, `${COMMAND_PREFIX}${name}`, channelId);
}
