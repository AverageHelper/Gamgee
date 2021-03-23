import type Discord from "discord.js";
import requireEnv from "../requireEnv";
import { testerClient } from "./testerClient";

const COMMAND_PREFIX = requireEnv("BOT_PREFIX");
const TEST_CHANNEL_ID = requireEnv("CHANNEL_ID");

export async function sendMessage(
  content: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message> {
  const client = await testerClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel.isText()) throw new Error(`Channel ${channelId} is not a text channel.`);

  return channel.send(content);
}

export function sendCommand(
  name: string,
  channelId: string = TEST_CHANNEL_ID
): Promise<Discord.Message> {
  return sendMessage(`${COMMAND_PREFIX}${name}`, channelId);
}
