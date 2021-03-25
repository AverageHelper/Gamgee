import type Discord from "discord.js";
import { requireEnv } from "../../src/helpers/environment";
import { sendCommand } from "./sendMessage";
import { waitForMessage } from "./messageDispatch";

const UUT_ID = requireEnv("BOT_TEST_ID");
const TEST_CHANNEL_ID = requireEnv("CHANNEL_ID");

/**
 * Sends a command message in the provided channel, and waits for
 * some response from the bot unit under test (UUT).
 *
 * @param command The command to send. The UUT's configured prefix is
 * automatically prepended.
 * @param channelId The ID of the channel in which to send the command,
 * and from which a response should be received.
 *
 * @returns The message that was received, or `null` if no matching
 * message was found within the timeout duration.
 */
export async function commandResponseInSameChannel(
  command: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message | null> {
  await sendCommand(command, channelId);
  return waitForMessage(response => {
    return response.author.id === UUT_ID && response.channel.id === channelId;
  });
}
