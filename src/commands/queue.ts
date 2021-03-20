import type { Command } from "./index";
import { SAFE_PRINT_LENGTH } from "../constants/output";
import { ConfigValue } from "../constants/config";
import { useQueue } from "../actions/queue/useQueue";
import { setConfigQueueChannel } from "../actions/config/setConfigValue";
import { useLogger } from "../logger";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";
import getQueueChannel from "../actions/queue/getQueueChannel";
import getChannelFromMention from "../helpers/getChannelFromMention";
import StringBuilder from "../helpers/StringBuilder";
import durationString from "../helpers/durationString";
import songRequest from "./songRequest";

const logger = useLogger();

const name = "queue";
const ARG_INFO = "info";
const ARG_START = "open";
const ARG_STOP = "close";
const ARG_RESTART = "restart";
const ARG_LIMIT = "limit";

type Argument =
  | typeof ARG_INFO
  | typeof ARG_START
  | typeof ARG_STOP
  | typeof ARG_RESTART
  | typeof ARG_LIMIT;

const allSubargs = [ARG_START, ARG_STOP, ARG_RESTART, ARG_LIMIT];
const subargsList = allSubargs.map(v => `\`${v}\``).join(", ");

const ARG_ENTRY_DURATION = "entry-duration";
const ARG_SUB_COOLDOWN = "cooldown";

type LimitKey = typeof ARG_ENTRY_DURATION | typeof ARG_SUB_COOLDOWN;

const allLimits = [ARG_ENTRY_DURATION, ARG_SUB_COOLDOWN];
const limitsList = allLimits.map(l => `\`${l}\``).join(", ");

function isLimitKey(value: unknown): value is LimitKey {
  return !!value && typeof value === "string" && allLimits.includes(value);
}

const queue: Command = {
  name,
  description: "Prints a handy message to let people know how to queue-up.",
  uses: [
    [`${name} info`, "Reports the status of the current queue. *(Server owner only. No touch!)*"],
    [
      `${name} ${ARG_START} <channel name>`,
      "Sets the channel up as a new queue. Any existing queue is saved, but queue and request commands will go to this new queue instead. *(Server owner only. No touch!)*"
    ],
    [`${name} ${ARG_STOP}`, "Closes the current queue. *(Server owner only. No touch!)*"],
    [
      `${name} ${ARG_RESTART}`,
      "Empties the queue and starts a fresh queue session. *(Server owner only. No touch!)*"
    ],
    [
      `${name} ${ARG_LIMIT} [${allLimits.join("|")}]`,
      "Sets a limit value on the queue. *(Server owner only. No touch!)*"
    ]
  ],
  async execute(context) {
    const { message, args, storage } = context;

    async function reply(msg: string) {
      await Promise.all([
        message.channel.send(msg), //
        message.channel.stopTyping(true)
      ]);
    }
    async function reply_private(msg: string) {
      await message.author.send(`(Reply from <#${message.channel.id}>)\n${msg}`);
    }

    if (args.length < 1) {
      // Print the standard help
      const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
      const helpBuilder = new StringBuilder();

      helpBuilder.push(`To submit a song, type \`${COMMAND_PREFIX}${songRequest.name} <link>\`.`);
      helpBuilder.pushNewLine();
      helpBuilder.push(
        `For example: \`${COMMAND_PREFIX}${songRequest.name} https://youtu.be/dQw4w9WgXcQ\``
      );
      helpBuilder.pushNewLine();
      helpBuilder.push(
        "I will respond with a text verification indicating your song has joined the queue!"
      );

      return reply(helpBuilder.result());
    }

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply("YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const command = args[0] as Argument;

    switch (command) {
      case ARG_INFO: {
        // Get the current queue's status
        const channel = await getQueueChannel(context);
        if (!channel) {
          return reply(
            `No queue is set up. Would you like to start one? (Try using \`${name} ${ARG_START}\`)`
          );
        }
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
          queueIsCurrent ? reply(response) : reply_private(response), //
          message.delete()
        ]);
        return;
      }

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
        await reply("Time for a reset! :bucket: Clearing the queue...");
        void message.channel.startTyping(5);

        const queue = await useQueue(channel);
        const deleteMessages = (await queue.getAllEntries())
          .map(entry => entry.queueMessageId)
          .map(messageId => channel.messages.delete(messageId));
        await Promise.all(deleteMessages);
        await queue.clear();
        return reply("The queue has restarted.");
      }

      case ARG_LIMIT: {
        const channel = await getQueueChannel(context);
        if (!channel) {
          return reply("No queue is set up yet.");
        }
        const queue = await useQueue(channel);

        // Set limits on the queue
        if (args.length < 2) {
          return reply(`Gonna need more info than that. Add one of: ${limitsList}.`);
        }

        const limitKey = args[1];
        if (!isLimitKey(limitKey)) {
          const that = limitKey.length <= SAFE_PRINT_LENGTH ? `'${limitKey}'` : "that";
          return reply(`I'm not sure what ${that} is. ` + limitsList);
        }

        const config = await queue.getConfig();
        let value: ConfigValue | undefined = args.length >= 3 ? args[2] : undefined;

        switch (limitKey) {
          case ARG_ENTRY_DURATION: {
            // Limit each duration entry
            if (value === undefined) {
              // Read the current limit
              value = config.entryDurationSeconds;
              if (value === null) {
                return reply(`There is no limit on entry duration.`);
              }
              return reply(`Entry duration limit is **${durationString(value)}**`);
            }

            // Set a new limit
            value = args[2] === "null" ? null : parseInt(args[2]);
            if (value !== null && isNaN(value)) {
              value = config.entryDurationSeconds;
              return reply("That doesn't look like an integer. Enter a number value in seconds.");
            }
            value = value === null || value < 0 ? null : value;
            await queue.updateConfig({ entryDurationSeconds: value });

            const responseBuilder = new StringBuilder("Entry duration limit ");
            if (value === null) {
              responseBuilder.pushBold("removed");
            } else {
              responseBuilder.push("set to ");
              responseBuilder.pushBold(durationString(value));
            }
            return reply(responseBuilder.result());
          }

          case ARG_SUB_COOLDOWN: {
            // Limit submission cooldown
            if (value === undefined) {
              value = config.cooldownSeconds;
              if (value === null) {
                return reply(`There is no submission cooldown time`);
              }
              return reply(`Submission cooldown is **${durationString(value)}**`);
            }

            // Set a new limit
            value = args[2] === "null" ? null : parseInt(args[2]);
            if (value !== null && isNaN(value)) {
              value = config.cooldownSeconds;
              return reply("That doesn't look like an integer. Enter a number value in seconds.");
            }
            value = value === null || value < 0 ? null : value;
            await queue.updateConfig({ cooldownSeconds: value });

            const responseBuilder = new StringBuilder("Submission cooldown ");
            if (value === null) {
              responseBuilder.pushBold("removed");
            } else {
              responseBuilder.push("set to ");
              responseBuilder.pushBold(durationString(value));
            }
            return reply(responseBuilder.result());
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

export default queue;
