import type Discord from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { sendCommand } from "./sendMessage.js";
import { useTesterClient } from "./testerClient.js";
import { waitForMessage } from "./messageDispatch.js";

const UUT_ID: Discord.Snowflake = requireEnv("BOT_TEST_ID");
const TEST_CHANNEL_ID: Discord.Snowflake = requireEnv("CHANNEL_ID");

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
	const channelId: Discord.Snowflake = TEST_CHANNEL_ID;
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
