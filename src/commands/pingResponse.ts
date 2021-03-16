import type { CommandContext } from "./index";
import { randomPhrase } from "../actions/randomStrings";

export default async function pong(context: CommandContext): Promise<string> {
  const { client, message } = context;

  const apiLatency = Math.round(client.ws.ping);

  const testMessage = await message.channel.send(randomPhrase());
  const responseTime = testMessage.createdTimestamp - message.createdTimestamp;

  const response = await testMessage.edit(
    `Pong! Sent response in \`${responseTime}ms\`. API Latency is \`${apiLatency}ms\``
  );
  console.log(`Out-of-band response: '${response.content}'`);

  return "";
}
