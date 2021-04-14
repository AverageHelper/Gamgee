import type { Command } from "./Command";
import { randomPhrase } from "../helpers/randomStrings";

const ping: Command = {
  name: "ping",
  description: "Ping my host server to check latency.",
  async execute({ client, message, logger }) {
    const apiLatency = Math.round(client.ws.ping);

    const testMessage = await message.channel.send(randomPhrase());
    const responseTime = testMessage.createdTimestamp - message.createdTimestamp;

    await testMessage.edit(
      `Pong! Sent response in \`${responseTime}ms\`. API latency is \`${apiLatency}ms\``
    );
    logger.info(`Sent ping response in ${responseTime}ms. API latency is ${apiLatency}ms.`);
  }
};

export default ping;
