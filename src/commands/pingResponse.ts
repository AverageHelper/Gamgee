import type { CommandContext } from "./index";
import { randomPhrase } from "../actions/randomStrings";

export default async function pong(context: CommandContext): Promise<string> {
  const { client, message } = context;

  const testMessage = await message.channel.send(randomPhrase());
  await testMessage.edit(
    `Pong! Sent response in \`${
      testMessage.createdTimestamp - message.createdTimestamp
    }ms\`. API Latency is \`${Math.round(client.ws.ping)}ms\``
  );

  return "";
}
