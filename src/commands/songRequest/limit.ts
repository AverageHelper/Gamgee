import type { NamedSubcommand } from "./../index";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { ConfigValue } from "../../constants/config";
import { reply } from "./index";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";

const ARG_ENTRY_DURATION = "entry-duration";
const ARG_SUB_COOLDOWN = "cooldown";

type LimitKey = typeof ARG_ENTRY_DURATION | typeof ARG_SUB_COOLDOWN;

const allLimits = [ARG_ENTRY_DURATION, ARG_SUB_COOLDOWN];
const limitsList = allLimits.map(l => `\`${l}\``).join(", ");

function isLimitKey(value: unknown): value is LimitKey {
  return !!value && typeof value === "string" && allLimits.includes(value);
}

const limit: NamedSubcommand = {
  name: "limit",
  requiredArgFormat: `<${allLimits.join("|")}>`,
  description: "Sets a limit value on the queue. *(Server owner only. No touch!)*",
  async execute(context) {
    const { args, message } = context;

    // Only the guild owner may touch the queue.
    // FIXME: Add more grannular access options
    if (!message.guild?.ownerID || message.author.id !== message.guild.ownerID) {
      return reply(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
    }

    const channel = await getQueueChannel(context);
    if (!channel) {
      return reply(message, "No queue is set up yet.");
    }
    const queue = await useQueue(channel);

    // Set limits on the queue
    if (args.length < 2) {
      return reply(message, `Gonna need more info than that. Add one of: ${limitsList}.`);
    }

    const limitKey = args[1];
    if (!isLimitKey(limitKey)) {
      const that = limitKey.length <= SAFE_PRINT_LENGTH ? `'${limitKey}'` : "that";
      return reply(message, `I'm not sure what ${that} is. ` + limitsList);
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
            return reply(message, `There is no limit on entry duration.`);
          }
          return reply(message, `Entry duration limit is **${durationString(value)}**`);
        }

        // Set a new limit
        value = args[2] === "null" ? null : parseInt(args[2]);
        if (value !== null && isNaN(value)) {
          value = config.entryDurationSeconds;
          return reply(
            message,
            "That doesn't look like an integer. Enter a number value in seconds."
          );
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
        return reply(message, responseBuilder.result());
      }

      case ARG_SUB_COOLDOWN: {
        // Limit submission cooldown
        if (value === undefined) {
          value = config.cooldownSeconds;
          if (value === null) {
            return reply(message, `There is no submission cooldown time`);
          }
          return reply(message, `Submission cooldown is **${durationString(value)}**`);
        }

        // Set a new limit
        value = args[2] === "null" ? null : parseInt(args[2]);
        if (value !== null && isNaN(value)) {
          value = config.cooldownSeconds;
          return reply(
            message,
            "That doesn't look like an integer. Enter a number value in seconds."
          );
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
        return reply(message, responseBuilder.result());
      }

      default: {
        const that =
          (limitKey as string).length <= SAFE_PRINT_LENGTH ? `'${limitKey as string}'` : "that";
        return reply(message, `I'm not sure what ${that} is. ` + limitsList);
      }
    }
  }
};

export default limit;
