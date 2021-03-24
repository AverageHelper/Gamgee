import type { NamedSubcommand } from "./../index";
import { useLogger } from "../../logger";
import { useQueue } from "../../actions/queue/useQueue";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import { deleteMessage } from "../../actions/messages/deleteMessage";
import { reply, reply_private } from "./index";

const logger = useLogger();

const stats: NamedSubcommand = {
  name: "stats",
  description: "Print statistics on the current queue.",
  async execute(context) {
    const { message } = context;

    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const channel = await getQueueChannel(context);

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== channel?.id
    ) {
      await message.author.send("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }
    if (!channel) {
      return reply(message, `No queue is set up. Would you like to start one?`);
    }

    // Get the current queue's status
    const queueIsCurrent = message.channel.id === channel.id;
    const queue = await useQueue(channel);
    const [count, playtimeRemaining, playtimeTotal] = await Promise.all([
      queue.count(),
      queue.playtimeRemaining(),
      queue.playtimeTotal()
    ]);
    const playtimePlayed = playtimeTotal - playtimeRemaining;
    logger.info(
      `Info requested: ${durationString(playtimePlayed)} of ${durationString(
        playtimeTotal
      )} played. (${durationString(playtimeRemaining)} remaining in queue)`
    );

    const responseBuilder = new StringBuilder();
    responseBuilder.push(`Queue channel: <#${channel.id}>`);
    if (queueIsCurrent) {
      responseBuilder.push(" (in here)");
    }
    responseBuilder.pushNewLine();

    if (count) {
      const singular = count === 1;
      const are = singular ? "is" : "are";
      const s = singular ? "" : "s";

      responseBuilder.push(`There ${are} `);
      responseBuilder.pushBold(`${count} song${s}`);
      responseBuilder.push(" in the queue, with ");

      if (playtimeRemaining === 0) {
        responseBuilder.pushBold(`all ${durationString(playtimeTotal)}`);
        responseBuilder.push(" played.");
      } else if (playtimePlayed === 0) {
        responseBuilder.pushBold(durationString(playtimeRemaining));
        responseBuilder.push(" total playtime remaining.");
      } else {
        responseBuilder.pushBold(durationString(playtimeRemaining));
        responseBuilder.push(" playtime remaining of ");
        responseBuilder.pushBold(durationString(playtimeTotal));
        responseBuilder.push(" total.");
      }
    } else {
      responseBuilder.push("Nothing has been added yet.");
    }
    const response = responseBuilder.result();
    await Promise.all([
      queueIsCurrent ? reply(message, response) : reply_private(message, response), //
      deleteMessage(message, "Spam; Users shouldn't see this")
    ]);
    return;
  }
};

export default stats;
