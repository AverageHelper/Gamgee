import type Discord from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { sendCommand } from "./sendMessage.js";
import { waitForMessage } from "./messageDispatch.js";

const UUT_ID: Discord.Snowflake = requireEnv("BOT_TEST_ID");
const TEST_CHANNEL_ID: Discord.Snowflake = requireEnv("CHANNEL_ID");

/**
 * Sends a command message in the provided channel, and waits for
 * some response from the bot unit under test (UUT).
 *
 * @param command The command to send. The UUT's configured prefix is
 * automatically prepended.
 * @param channelId The ID of the channel in which to send the command,
 * and from which a response should be received.
 * @param expectToContain A string that should be found in the content
 * of the received message.
 *
 * @returns The message that was received, or `null` if no matching
 * message was found within the timeout duration.
 */
export async function commandResponseInSameChannel(
	command: string,
	channelId: Discord.Snowflake = TEST_CHANNEL_ID,
	expectToContain: string | undefined = undefined
): Promise<Discord.Message | null> {
	const commandMsg = await sendCommand(command, channelId);
	return await waitForMessage(response => {
		return (
			response.author.id === UUT_ID &&
			response.channel.id === channelId &&
			response.createdTimestamp > commandMsg.createdTimestamp &&
			(expectToContain === undefined ||
				expectToContain === "" ||
				response.content.toLowerCase().includes(expectToContain.toLowerCase()))
		);
	});
}
