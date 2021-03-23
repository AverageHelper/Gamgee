import type Discord from "discord.js";
import requireEnv from "../requireEnv";
import { getLastMessageFromChannel } from "./getLastMessageFromChannel";
import { sendCommand } from "./sendMessage";

const UUT_ID = requireEnv("BOT_TEST_ID");
const TEST_CHANNEL_ID = requireEnv("CHANNEL_ID");

export async function commandResponseInSameChannel(
  command: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message | null> {
  const commandMessage = await sendCommand(command, channelId);
  const MAX_RETRIES = 80;

  for (let i = 0; i < MAX_RETRIES; i++) {
    await new Promise(resolve => setTimeout(resolve, 120));
    const response = await getLastMessageFromChannel(commandMessage.channel.id);
    if (
      (response?.createdTimestamp ?? 0) > commandMessage.createdTimestamp &&
      response?.author.id === UUT_ID
    ) {
      return response;
    }
  }
  return null;
}
