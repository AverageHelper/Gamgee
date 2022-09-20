import type { Snowflake } from "discord.js";
import { sendCommand } from "./sendMessage";
import { requireEnv, useTesterClient } from "./testerClient";
import { waitForMessage } from "./messageDispatch";

const UUT_ID: Snowflake = requireEnv("BOT_TEST_ID");
const TEST_CHANNEL_ID: Snowflake = requireEnv("CHANNEL_ID");

/**
 * Sends a command message in the test channel, and waits for
 * some response from the bot unit under test (UUT).
 *
 * @param command The command to send. The UUT's configured prefix is
 * automatically prepended.
 * @param expectToContain A string that should be found in the content
 * of the received message.
 *
 * @returns The content of the message that was received, or `null` if
 * no matching message was found within the timeout duration.
 */
export async function commandResponseInTestChannel(
	command: string,
	expectToContain: string | undefined = undefined
): Promise<string | null> {
	const channelId: Snowflake = TEST_CHANNEL_ID;
	return await useTesterClient(async client => {
		const commandMsg = await sendCommand(client, command, channelId);
		const message = await waitForMessage(response => {
			return (
				response.author.id === UUT_ID &&
				response.channel.id === channelId &&
				response.createdTimestamp > commandMsg.createdTimestamp &&
				(expectToContain === undefined ||
					expectToContain === "" ||
					response.content.toLowerCase().includes(expectToContain.toLowerCase()))
			);
		});
		return message?.content ?? null;
	});
}
