import type Discord from "discord.js";
import type { Command } from "./../index";
import { deleteMessage, replyPrivately } from "../../actions/messages";

import arbitrarySubcommand from "./urlRequest";
import info from "./info";
import setup from "./setup";
import open from "./open";
import close from "./close";
import limit from "./limit";
import stats from "./stats";
import restart from "./restart";

const namedSubcommands = [info, setup, open, close, limit, stats, restart];

export async function reply(message: Discord.Message, msg: string): Promise<void> {
  await Promise.all([
    message.channel.send(msg), //
    message.channel.stopTyping(true)
  ]);
}

export async function reply_private(message: Discord.Message, msg: string): Promise<void> {
  await replyPrivately(message, msg);
}

export async function reject_private(message: Discord.Message, reason: string): Promise<void> {
  await Promise.all([
    deleteMessage(message, "Spam; this song request was rejected."),
    replyPrivately(message, reason)
  ]);
}

export async function reject_public(message: Discord.Message, reason: string): Promise<void> {
  await Promise.all([
    message.channel.send(`:hammer: <@!${message.author.id}>, ${reason}`),
    message.suppressEmbeds(true)
  ]);
}

const sr: Command = {
  name: "sr",
  description: "Submit a song to the queue.",
  namedSubcommands,
  arbitrarySubcommand,
  async execute(context) {
    const { message, args } = context;

    // Prepare arguments
    if (args.length < 1) {
      return reject_public(message, "You're gonna have to add a song link to that.");
    }

    const arg = args[0];

    for (const command of namedSubcommands) {
      if (command.name === arg) {
        return command.execute(context);
      }
    }

    return arbitrarySubcommand.execute(context);
  }
};

export default sr;
