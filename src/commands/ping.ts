import type Discord from "discord.js";
import type { Command } from "./Command";
import { randomPhrase } from "../helpers/randomStrings";

const ping: Command = {
  name: "ping",
  description: "Ping my host server to check latency.",
  async execute(context) {
    const { client, logger } = context;
    const apiLatency = Math.round(client.ws.ping);

    let testMessage: Discord.Message;
    let responseTime: number;

    if (context.type === "message") {
      testMessage = await context.message.reply(randomPhrase());
      responseTime = testMessage.createdTimestamp - context.message.createdTimestamp;
    } else {
      await context.interaction.reply(randomPhrase());
      testMessage = (await context.interaction.fetchReply()) as Discord.Message;
      responseTime = testMessage.createdTimestamp - context.interaction.createdTimestamp;
    }

    await testMessage.edit(
      `Pong! Sent response in \`${responseTime}ms\`. API latency is \`${apiLatency}ms\``
    );
    logger.info(`Sent ping response in ${responseTime}ms. API latency is ${apiLatency}ms.`);
  }
};

export default ping;
