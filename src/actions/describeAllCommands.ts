import type Discord from "discord.js";
import type { Command } from "../commands";
import type { Storage } from "../configStorage";
import { getConfigCommandPrefix } from "./config/getConfigValue";
import StringBuilder from "../helpers/StringBuilder";

/**
 * Constructs a string that describes the available commands.
 *
 * @param commands The collection of available commands.
 * @returns a string describing all commands.
 */
export default async function describeAllCommands(
  storage: Storage | null,
  commands: Discord.Collection<string, Command>
): Promise<string> {
  const COMMAND_PREFIX = await getConfigCommandPrefix(storage);
  const DASH = " - ";
  const INDENT = "    ";
  const CODE = "`";

  // Describe all commands
  const bodyBuilder = new StringBuilder();
  commands.array().forEach(command => {
    const firstArg: Discord.ApplicationCommandOptionData | undefined = command.options?.[0];
    const firstArgFormat: string | undefined = firstArg ? `<${firstArg.name}>` : undefined;
    const cmdDesc = new StringBuilder();

    // Describe the command
    cmdDesc.push(CODE);
    cmdDesc.push(`${COMMAND_PREFIX}${command.name}`);
    if (firstArgFormat !== undefined && firstArgFormat !== "") {
      cmdDesc.push(` ${firstArgFormat}`);
    }
    cmdDesc.push(CODE);

    cmdDesc.push(DASH);
    cmdDesc.push(command.description);

    // Describe all subcommands
    command.options
      ?.filter(optn => optn.type === "SUB_COMMAND" || optn.type === "SUB_COMMAND_GROUP")
      ?.forEach(sub => {
        const subarg: Discord.ApplicationCommandOptionData | undefined = sub.options?.[0];
        const subargFormat: string | undefined = subarg ? `<${subarg.name}>` : undefined;

        // Describe the subcommand
        const subDesc = new StringBuilder();
        subDesc.pushNewLine();
        subDesc.push(INDENT);

        subDesc.push(CODE);
        subDesc.push(`${COMMAND_PREFIX}${command.name} ${sub.name}`);
        if (subargFormat !== undefined && subargFormat !== "") {
          subDesc.push(` ${subargFormat}`);
        }
        subDesc.push(CODE);

        subDesc.push(DASH);
        subDesc.push(sub.description);
        cmdDesc.push(subDesc.result());
      });

    bodyBuilder.push(cmdDesc.result());
    bodyBuilder.pushNewLine();
  });

  return bodyBuilder.result();
}
