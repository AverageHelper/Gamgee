import type { Command } from "../Command";
import { invokeCommand } from "../../actions/invokeCommand";
import StringBuilder from "../../helpers/StringBuilder";
import setup from "./setup";
import teardown from "./teardown";
import blacklist from "./blacklist";
import whitelist from "./whitelist";
import open from "./open";
import close from "./close";
import limit from "./limit";
import stats from "./stats";
import restart from "./restart";
import { isNonEmptyArray } from "../../helpers/guards";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers";

const namedSubcommands = [
  setup,
  teardown,
  blacklist,
  whitelist,
  open,
  close,
  limit,
  stats,
  restart
];

const sr: Command = {
  name: "queue",
  description: "Administrative commands to manage the song queue.",
  options: namedSubcommands,
  requiresGuild: true,
  permissions: ["owner", "admin", "queue-admin"],
  async execute(context) {
    if (!isNonEmptyArray(context.options)) {
      // const response = new StringBuilder("The possible subcommands are:");
      // Object.values(namedSubcommands).forEach(command => {
      //   response.pushNewLine();
      //   response.push(" - ");
      //   response.pushCode(command.name);
      // });

      // return context.reply(response.result());
      return; // do nothing
    }

    const arg: string = resolveSubcommandNameFromOption(context.options[0]);
    const argOptions = context.options[0].options ?? [];
    context.logger.debug(`[queue] Our arg is '${arg ?? "undefined"}'`);

    context.logger.debug(
      `Searching ${
        namedSubcommands.length
      } possible subcommands for one named '${arg}': ${JSON.stringify(
        namedSubcommands.map(c => c.name),
        undefined,
        2
      )}`
    );
    for (const command of namedSubcommands) {
      if (command.name === arg) {
        context.options = argOptions;
        context.logger.debug(
          `Handling subcommand '${command.name}' with options: ${JSON.stringify(
            context.options,
            undefined,
            2
          )}`
        );
        return invokeCommand(command, context);
      }
    }

    const response = new StringBuilder("The possible subcommands are:");
    Object.values(namedSubcommands).forEach(command => {
      response.pushNewLine();
      response.push(" - ");
      response.pushCode(command.name);
    });
    return context.reply(response.result());
  }
};

export default sr;
