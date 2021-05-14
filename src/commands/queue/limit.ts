import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { useQueue } from "../../actions/queue/useQueue";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import durationString from "../../helpers/durationString";
import StringBuilder from "../../helpers/StringBuilder";
import { resolveIntegerFromOption, resolveStringFromOption } from "../../helpers/optionResolvers";

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
  return Boolean(value) && typeof value === "string" && allLimits.includes(value as LimitKey);
}

const limit: Subcommand = {
  name: "limit",
  description: "Set a limit value on the queue. (Time in seconds, where applicable)",
  options: [
    {
      name: "key",
      description: "The name of the limit.",
      type: "STRING",
      required: true,
      choices: allLimits.map(key => ({
        name: key,
        value: key
      }))
    },
    {
      name: "value",
      description: "The new value to set for the key.",
      type: "INTEGER"
    }
  ],
  type: "SUB_COMMAND",
  requiresGuild: true,
  permissions: ["owner", "admin", "queue-admin"],
  async execute({ guild, options, reply }) {
    const queueChannel = await getQueueChannel(guild);

    if (!queueChannel) {
      return reply("No queue is set up.");
    }

    const queue = useQueue(queueChannel);
    const config = await queue.getConfig();

    const keyOption = options[0];
    const valueOption = options[1];

    if (!keyOption) {
      // Read out the existing limits
      const responseBuilder = new StringBuilder("Queue Limits:");

      allLimits.forEach(key => {
        responseBuilder.pushNewLine();
        responseBuilder.pushCode(key);
        responseBuilder.push(" - ");

        switch (key) {
          case ARG_SUB_COOLDOWN:
            if (config.cooldownSeconds !== null && config.cooldownSeconds > 0) {
              responseBuilder.pushBold(durationString(config.cooldownSeconds));
            } else {
              responseBuilder.pushBold("none");
            }
            break;
          case ARG_ENTRY_DURATION:
            if (config.entryDurationSeconds !== null && config.entryDurationSeconds > 0) {
              responseBuilder.pushBold(durationString(config.entryDurationSeconds));
            } else {
              responseBuilder.pushBold("infinite");
            }
            break;
          case ARG_SUB_MAX_SUBMISSIONS:
            if (config.submissionMaxQuantity !== null && config.submissionMaxQuantity > 0) {
              responseBuilder.pushBold(config.submissionMaxQuantity.toString());
            } else {
              responseBuilder.pushBold("infinite");
            }
            break;
        }
      });

      return reply(responseBuilder.result());
    }

    const key: string = resolveStringFromOption(keyOption);

    if (!isLimitKey(key)) {
      const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
      return reply(`I'm not sure what ${that} is. Try one of ${limitsList}`);
    }

    // Set limits on the queue
    switch (key) {
      case ARG_ENTRY_DURATION: {
        // Limit each duration entry
        if (!valueOption) {
          // Read the current limit
          const value = config.entryDurationSeconds;
          if (value === null) {
            return reply(`There is no limit on entry duration.`);
          }
          return reply(`Entry duration limit is **${durationString(value)}**`);
        }

        // Set a new limit
        let value = resolveIntegerFromOption(valueOption);
        if (value !== null && Number.isNaN(value)) {
          return reply("That doesn't look like an integer. Enter a number value in seconds.");
        }
        value = value === null || value <= 0 ? null : value;
        await queue.updateConfig({ entryDurationSeconds: value });

        const responseBuilder = new StringBuilder("Entry duration limit ");
        if (value === null || value <= 0) {
          responseBuilder.pushBold("removed");
        } else {
          responseBuilder.push("set to ");
          responseBuilder.pushBold(durationString(value));
        }
        return reply(responseBuilder.result());
      }

      case ARG_SUB_COOLDOWN: {
        // Limit submission cooldown
        if (!valueOption) {
          // Read the current limit
          const value = config.cooldownSeconds;
          if (value === null) {
            return reply("There is no submission cooldown time");
          }
          return reply(`Submission cooldown is **${durationString(value)}**`);
        }

        // Set a new limit
        let value = resolveIntegerFromOption(valueOption);
        if (value !== null && Number.isNaN(value)) {
          value = config.cooldownSeconds;
          return reply("That doesn't look like an integer. Enter a number value in seconds.");
        }
        value = value === null || value <= 0 ? null : value;
        await queue.updateConfig({ cooldownSeconds: value });

        const responseBuilder = new StringBuilder("Submission cooldown ");
        if (value === null || value <= 0) {
          responseBuilder.pushBold("removed");
        } else {
          responseBuilder.push("set to ");
          responseBuilder.pushBold(durationString(value));
        }
        return reply(responseBuilder.result());
      }

      case ARG_SUB_MAX_SUBMISSIONS: {
        // Limit submission count per user
        if (!valueOption) {
          // Read the current limit
          const value = config.submissionMaxQuantity;
          if (value === null) {
            return reply("There is no limit on the number of submissions per user.");
          }
          return reply(`Max submissions per user is **${value}**`);
        }

        // Set a new limit
        let value = resolveIntegerFromOption(valueOption);
        if (value !== null && Number.isNaN(value)) {
          value = config.submissionMaxQuantity;
          return reply("That doesn't look like an integer. Enter a number value in seconds.");
        }
        value = value === null || value <= 0 ? null : value;
        await queue.updateConfig({ submissionMaxQuantity: value });

        const responseBuilder = new StringBuilder("Submission count limit per user ");
        if (value === null || value <= 0) {
          responseBuilder.pushBold("removed");
        } else {
          responseBuilder.push("set to ");
          responseBuilder.pushBold(`${value}`);
        }
        return reply(responseBuilder.result());
      }
    }
  }
};

export default limit;
