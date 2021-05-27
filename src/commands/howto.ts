import type { GuildedCommand } from "./Command";
import { getConfigCommandPrefix } from "../actions/config/getConfigValue";
import StringBuilder from "../helpers/StringBuilder";

const howto: GuildedCommand = {
  name: "howto",
  description: "Print instructions for using the common queue commands.",
  requiresGuild: true,
  async execute({ storage, type, reply }) {
    const sr = (await import("./songRequest")).default;
    const nowPlaying = (await import("./nowPlaying")).default;

    // Print the standard help
    const COMMAND_PREFIX = type === "message" ? await getConfigCommandPrefix(storage) : "/";
    const helpBuilder = new StringBuilder();

    helpBuilder.push(`To submit a song, type \`${COMMAND_PREFIX}${sr.name} <link>\`.`);
    helpBuilder.pushNewLine();
    helpBuilder.push(`For example: \`${COMMAND_PREFIX}${sr.name} https://youtu.be/dQw4w9WgXcQ\``);
    helpBuilder.pushNewLine();
    helpBuilder.push(
      "I will respond with a text verification indicating your song has joined the queue!"
    );
    helpBuilder.pushNewLine();
    helpBuilder.pushNewLine();

    helpBuilder.push("To see the current song, type ");
    helpBuilder.pushCode(`${COMMAND_PREFIX}${nowPlaying.name}`);
    if (type === "message") {
      helpBuilder.push(" and check your DMs");
    }
    helpBuilder.push(".");

    return reply(helpBuilder.result());
  }
};

export default howto;
