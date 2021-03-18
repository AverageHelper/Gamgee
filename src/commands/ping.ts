import type { Command } from "./index";
import { randomPhrase } from "../helpers/randomStrings";
import { useLogger } from "../logger";

const logger = useLogger();

const ping: Command = {
  name: "ping",
  description: "Ping Gamgee's server to check latency.",
  async execute(context) {
    const { client, message } = context;

    const apiLatency = Math.round(client.ws.ping);

    const testMessage = await message.channel.send(randomPhrase());
    const responseTime = testMessage.createdTimestamp - message.createdTimestamp;

    const response = await testMessage.edit(
      `Pong! Sent response in \`${responseTime}ms\`. API Latency is \`${apiLatency}ms\``
    );
    logger.info(`Response: '${response.content}'`);
  }
};

export default ping;
