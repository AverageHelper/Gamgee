import type { NamedSubcommand } from "./../index";
import { reply } from "./index";
import { getConfigCommandPrefix } from "../../actions/config/getConfigValue";
import StringBuilder from "../../helpers/StringBuilder";
import songRequest from "./index";

const info: NamedSubcommand = {
  name: "info",
  description: "Prints a handy message to let people know how to queue-up.",
  async execute({ message, storage }) {
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

    return reply(message, helpBuilder.result());
  }
};

export default info;
