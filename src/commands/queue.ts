import type { Command } from "./index";
import getQueueChannel from "../actions/getQueueChannel";
import { useQueue } from "../actions/useQueue";
import { setConfigQueueChannel } from "../actions/config/setConfigValue";
import getChannelFromMention from "../helpers/getChannelFromMention";
import { useLogger } from "../logger";

const logger = useLogger();

const ARG_START = "open";
const ARG_STOP = "close";
const ARG_TOTAL_LIMIT = "total-limit";

const allSubargs = [ARG_START, ARG_STOP, ARG_TOTAL_LIMIT];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

type Argument = typeof ARG_START | typeof ARG_STOP | typeof ARG_TOTAL_LIMIT;

const name = "queue";

const yt: Command = {
  name,
  description: "Manage a user queue. *(Server owner only. No touch!)*",
  uses: [
    [name, "Reports the status of the current queue."],
    [
      `${name} ${ARG_START} {channel name}`,
      "Tells me to use the channel called {channel name} for the queue. The previous queue will be forgotten."
    ],
    [`${name} ${ARG_STOP}`, "Tells me to close the current queue."],
    [
      `${name} ${ARG_TOTAL_LIMIT} {number}`,
      "Sets a default limit to the number of total submissions that any user may put in the queue."
    ]
  ],
  async execute(context) {
    const { message, args, storage } = context;

    async function reply(reason: string) {
      await message.channel.send(reason);
    }

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.owner?.user.tag || message.author.tag !== message.guild.owner.user.tag) {
      return reply("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    if (args.length < 1) {
      // Get the current queue's status
      const channel = await getQueueChannel(context);
      if (!channel) {
        return reply(
          `No queue is set up. Would you like to start one? (Try using \`${name} ${ARG_START}\`)`
        );
      }

      const queueIsCurrent = message.channel.id === channel.id;
      const queue = useQueue(channel);
      const [count, playtime] = await Promise.all([queue.count(), queue.playtime()]);
      return reply(
        `Queue channel: <#${channel.id}>${queueIsCurrent ? " (in here)" : ""}\n${
          count
            ? `There ${count === 1 ? "is" : "are"} **${count} song${
                count === 1 ? "" : "s"
              }** in the queue, for a total of about **${Math.ceil(
                playtime
              )} minutes** of playtime.`
            : "Nothing has been added yet."
        }`
      );
    }
    const command = args[0] as Argument;

    switch (command) {
      case ARG_START: {
        if (args.length < 2) {
          return reply(`Please name a text channel to use for the queue!`);
        }
        const channelName = args[1];
        const channel = getChannelFromMention(message, channelName);
        if (!channel) {
          return reply(
            "That's not a real channel, or I don't know how to find it yet. Mention the channel with `#`."
          );
        }

        if (!channel.isText()) {
          return reply("I can't queue in a voice channel. Please specify a text channel instead");
        }

        logger.info(`Setting up channel '${channel.name}' for queuage.`);
        await Promise.all([
          setConfigQueueChannel(storage, channel.id),
          channel.send("This is a queue now. :smiley:")
        ]);

        return reply(`New queue set up in <#${channel.id}>`);
      }

      case ARG_STOP: {
        const channel = await getQueueChannel(context);
        const promises: Array<Promise<unknown>> = [setConfigQueueChannel(storage, null)];
        if (channel) {
          promises.push(channel.send("This queue is closed. :wave:"));
        }
        await Promise.all(promises);
        return reply("The queue is closed.");
      }

      case ARG_TOTAL_LIMIT:
        logger.info("Should set the default submission limit.");
        return reply("This command will eventually set a queue's per-user submission limit.");

      default:
        return reply(`Invalid command argument. Expected ${subargsList}`);
    }
  }
};

export default yt;
