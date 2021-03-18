import type { Command } from "./index";
import { SAFE_PRINT_LENGTH } from "../constants";
import { ConfigValue } from "../constants/config";
import { getConfigQueueLimitEntryDuration } from "../actions/config/getConfigValue";
import { useQueue } from "../actions/useQueue";
import {
  setConfigQueueChannel,
  setConfigQueueLimitEntryDuration
} from "../actions/config/setConfigValue";
import { useLogger } from "../logger";
import getQueueChannel from "../actions/getQueueChannel";
import getChannelFromMention from "../helpers/getChannelFromMention";

const logger = useLogger();

const ARG_START = "open";
const ARG_STOP = "close";
const ARG_RESTART = "restart";
const ARG_LIMIT = "limit";

type Argument = typeof ARG_START | typeof ARG_STOP | typeof ARG_RESTART | typeof ARG_LIMIT;

const ARG_ENTRY_DURATION = "entry-duration";

const allSubargs = [ARG_START, ARG_STOP, ARG_RESTART, ARG_LIMIT];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

const allLimits = [ARG_ENTRY_DURATION];
const limitsList = allLimits.map(l => `\`${l}\``).join(", ");

type LimitKey = typeof ARG_ENTRY_DURATION;

function isLimitKey(value: unknown): value is LimitKey {
  return !!value && typeof value === "string" && allLimits.includes(value);
}

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
    [`${name} ${ARG_RESTART}`, "Empties the queue and starts all over!"],
    [`${name} ${ARG_LIMIT} <${allLimits.join("|")}>`, "Sets a limit value on the queue."]
  ],
  async execute(context) {
    const { message, args, storage } = context;

    async function reply(msg: string) {
      await message.channel.send(msg);
    }
    async function reply_private(msg: string) {
      await message.author.send(`(Reply from <#${message.channel.id}>)\n${msg}`);
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
      const queue = await useQueue(channel);
      const [count, playtime] = await Promise.all([queue.count(), queue.playtime()]);

      const response: Array<string> = [];
      response.push(`Queue channel: <#${channel.id}>`);
      if (queueIsCurrent) {
        response.push(" (in here)");
      }
      response.push("\n");
      if (count) {
        const singular = count === 1;
        const are = singular ? "is" : "are";
        const s = singular ? "" : "s";
        response.push(
          `There ${are} **${count} song${s}** in the queue, for a total cost of about **${Math.ceil(
            playtime
          )} minutes** of playtime.`
        );
      } else {
        response.push("Nothing has been added yet.");
      }
      const queueInfo = response.join("");
      await Promise.all([
        queueIsCurrent ? reply(queueInfo) : reply_private(queueInfo), //
        message.delete()
      ]);
      return;
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
          channel.send("This is a queue now. :smiley:"),
          message
            .delete({ reason: "Users don't need to see this command once it's run." })
            .catch(error =>
              logger.error(
                `I don't seem to have permission to delete messages: ${JSON.stringify(
                  error,
                  undefined,
                  2
                )}`
              )
            )
        ]);

        const queueIsCurrent = message.channel.id === channel?.id;
        if (!queueIsCurrent) {
          return reply(`The queue is now open! :smiley:`);
        }
        return;
      }

      case ARG_STOP: {
        const channel = await getQueueChannel(context);
        if (!channel) {
          return reply("There is no open queue to close, silly! :stuck_out_tongue:");
        }
        const queueIsCurrent = message.channel.id === channel?.id;
        const promises: Array<Promise<unknown>> = [
          setConfigQueueChannel(storage, null),
          message
            .delete({ reason: "Users don't need to see this command once it's run." })
            .catch(error =>
              logger.error(
                `I don't seem to have permission to delete messages: ${JSON.stringify(
                  error,
                  undefined,
                  2
                )}`
              )
            )
        ];
        if (channel && !queueIsCurrent) {
          promises.push(channel.send("This queue is closed. :wave:"));
        }
        await Promise.all(promises);
        return reply("The queue is now closed. :wave:");
      }

      case ARG_RESTART: {
        const channel = await getQueueChannel(context);
        if (!channel) {
          return reply("No queue is set up. Maybe that's what you wanted...?");
        }
        const queue = await useQueue(channel);
        const deleteMessages = (await queue.getAllEntries())
          .map(entry => entry.queueMessageId)
          .map(messageId => channel.messages.delete(messageId));
        await Promise.all(deleteMessages);
        await queue.clear();
        return reply("The queue has restarted.");
      }

      case ARG_LIMIT: {
        // Set limits on the queue
        if (args.length < 2) {
          return reply(`Gonna need more info than that. Add one of: ${limitsList}.`);
        }

        const limitKey = args[1];
        if (!isLimitKey(limitKey)) {
          const that = limitKey.length <= SAFE_PRINT_LENGTH ? `'${limitKey}'` : "that";
          return reply(`I'm not sure what ${that} is. ` + limitsList);
        }

        if (args.length < 3) {
          return reply("Expected a value to set.");
        }
        let value: ConfigValue = args[2];

        switch (limitKey) {
          case ARG_ENTRY_DURATION: {
            // Set the guild's queue entry duration limit
            value = parseInt(args[2]);
            if (isNaN(value)) {
              value = await getConfigQueueLimitEntryDuration(storage);
              await reply("That doesn't look like an integer. Enter a number value in minutes");
            }
            await setConfigQueueLimitEntryDuration(storage, value);
            return reply(`Entry duration limit set to **${value} minutes**`);
          }

          default: {
            const that =
              (limitKey as string).length <= SAFE_PRINT_LENGTH ? `'${limitKey as string}'` : "that";
            return reply(`I'm not sure what ${that} is. ` + limitsList);
          }
        }
      }

      default:
        return reply(`Invalid command argument. Expected ${subargsList}`);
    }
  }
};

export default yt;
