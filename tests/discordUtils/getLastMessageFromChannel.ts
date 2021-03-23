import type Discord from "discord.js";
import { testerClient } from "./testerClient";

export async function getLastMessageFromChannel(
  channelId: string
): Promise<Discord.Message | null> {
  const client = await testerClient();
  const channel = await client.channels.fetch(channelId);
  if (!channel.isText()) throw new Error(`Channel ${channelId} is not a text channel.`);

  return channel.lastMessage;
}
