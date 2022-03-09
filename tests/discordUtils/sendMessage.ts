import type Discord from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { testerClient } from "./testerClient.js";

const COMMAND_PREFIX = requireEnv("BOT_PREFIX");
const TEST_CHANNEL_ID: Discord.Snowflake = requireEnv("CHANNEL_ID");

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
export async function sendMessage(
	content: string,
	channelId: Discord.Snowflake = TEST_CHANNEL_ID
): Promise<Discord.Message> {
	const client = await testerClient();
	const channel = await client.channels.fetch(channelId);
	if (!channel || !channel.isText()) throw new Error(`Channel ${channelId} is not a text channel.`);

	return channel.send(content);
}

/**
 * Instructs the tester bot to send a command message in the provided channel.
 * The command prefix for the bot unit under test (UUT) is automatically
 * prepended.
 *
 * @param content The content of the command to send, with the prefix omitted.
 * @param channelId The ID of the channel in which to send the command.
 *
 * @throws an error if the provided channel is not a text channel, or
 * something else went wrong with the send.
 *
 * @returns a `Promise` that resolves to the message that was sent.
 */
export async function sendCommand(
	name: string,
	channelId: Discord.Snowflake = TEST_CHANNEL_ID
): Promise<Discord.Message> {
	return sendMessage(`${COMMAND_PREFIX}${name}`, channelId);
}
