import type { Subcommand } from "../Command";
import { getConfigCommandPrefix } from "../../actions/config/getConfigValue";
import StringBuilder from "../../helpers/StringBuilder";

const info: Subcommand = {
  name: "info",
  description: "Print a handy message to let people know how to queue-up.",
  type: "SUB_COMMAND",
  async execute({ storage, reply }) {
    const songRequest = (await import("./index")).default;
    const nowPlaying = (await import("../nowPlaying")).default;

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
    helpBuilder.pushNewLine();
    helpBuilder.pushNewLine();
    helpBuilder.push(
      `To see the current song, type \`${COMMAND_PREFIX}${nowPlaying.name}\` and check your DMs.`
    );

    return reply(helpBuilder.result());
  }
};

export default info;
