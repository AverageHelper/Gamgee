import type { NamedSubcommand } from "./../index";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { ConfigValue } from "../../constants/config";
import { reply } from "./index";
import { useQueue } from "../../actions/queue/useQueue";
import { replyPrivately } from "../../actions/messages";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import userIsQueueAdmin from "../../actions/userIsQueueAdmin";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";

const ARG_ENTRY_DURATION = "entry-duration";
const ARG_SUB_COOLDOWN = "cooldown";
const ARG_SUB_MAX_SUBMISSIONS = "count";

type LimitKey =
  | typeof ARG_ENTRY_DURATION
  | typeof ARG_SUB_COOLDOWN
  | typeof ARG_SUB_MAX_SUBMISSIONS;

const allLimits: Array<LimitKey> = [ARG_ENTRY_DURATION, ARG_SUB_COOLDOWN, ARG_SUB_MAX_SUBMISSIONS];
const limitsList = allLimits.map(l => `\`${l}\``).join(", ");

function isLimitKey(value: unknown): value is LimitKey {
  return !!value && typeof value === "string" && allLimits.includes(value as LimitKey);
}

const limit: NamedSubcommand = {
  name: "limit",
  requiredArgFormat: `<${allLimits.join("|")}>`,
  description: "Set a limit value on the queue. (Time in seconds, where applicable)",
  async execute({ args, message }) {
    if (!message.guild) {
      return reply(message, "Can't do that here.");
    }

    const channel = await getQueueChannel(message);

    if (!channel) {
      return reply(message, "No queue is set up yet.");
    }

    const queue = await useQueue(channel);
    const config = await queue.getConfig();

    const limitKey = args[1];
    if (!limitKey) {
      // Read out the existing limits
      const responseBuilder = new StringBuilder("Queue Limits:");

      allLimits.forEach(key => {
        responseBuilder.pushNewLine();
        responseBuilder.pushCode(key);
        responseBuilder.push(" - ");

        switch (key) {
          case ARG_SUB_COOLDOWN:
            if (config.cooldownSeconds) {
              responseBuilder.pushBold(durationString(config.cooldownSeconds));
            } else {
              responseBuilder.pushBold("none");
            }
            break;
          case ARG_ENTRY_DURATION:
            if (config.entryDurationSeconds) {
              responseBuilder.pushBold(durationString(config.entryDurationSeconds));
            } else {
              responseBuilder.pushBold("infinite");
            }
            break;
          case ARG_SUB_MAX_SUBMISSIONS:
            if (config.submissionMaxQuantity) {
              responseBuilder.pushBold(config.submissionMaxQuantity.toString());
            } else {
              responseBuilder.pushBold("infinite");
            }
            break;
        }
      });

      return reply(message, responseBuilder.result());
    }

    // Only the queue admin may touch the queue, unless we're in the privileged queue channel.
    if (
      !(await userIsQueueAdmin(message.author, message.guild)) &&
      message.channel.id !== channel?.id
    ) {
      await replyPrivately(message, "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...");
      return;
    }

    if (!isLimitKey(limitKey)) {
      const that = limitKey.length <= SAFE_PRINT_LENGTH ? `'${limitKey}'` : "that";
      return reply(message, `I'm not sure what ${that} is. Try one of ` + limitsList);
    }

    // Set limits on the queue
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
        value = args[2] === "null" ? null : parseInt(args[2] ?? "-1");
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
        if (!value) {
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
            return reply(message, "There is no submission cooldown time");
          }
          return reply(message, `Submission cooldown is **${durationString(value)}**`);
        }

        // Set a new limit
        value = args[2] === "null" ? null : parseInt(args[2] ?? "-1");
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
        if (!value) {
          responseBuilder.pushBold("removed");
        } else {
          responseBuilder.push("set to ");
          responseBuilder.pushBold(durationString(value));
        }
        return reply(message, responseBuilder.result());
      }

      case ARG_SUB_MAX_SUBMISSIONS: {
        // Limit submission count per user
        if (value === undefined) {
          value = config.submissionMaxQuantity;
          if (value === null) {
            return reply(message, "There is no limit on the number of submissions per user.");
          }
          return reply(message, `Max submissions per user is **${value}**`);
        }

        // Set a new limit
        value = args[2] === "null" ? null : parseInt(args[2] ?? "-1");
        if (value !== null && isNaN(value)) {
          value = config.submissionMaxQuantity;
          return reply(
            message,
            "That doesn't look like an integer. Enter a number value in seconds."
          );
        }
        value = value === null || value < 0 ? null : value;
        await queue.updateConfig({ submissionMaxQuantity: value });

        const responseBuilder = new StringBuilder("Submission count limit per user ");
        if (!value) {
          responseBuilder.pushBold("removed");
        } else {
          responseBuilder.push("set to ");
          responseBuilder.pushBold(`${value}`);
        }
        return reply(message, responseBuilder.result());
      }
    }
  }
};

export default limit;
