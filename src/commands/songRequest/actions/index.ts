import type Discord from "discord.js";
import { deleteMessage, replyPrivately } from "../../../actions/messages";

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
    replyPrivately(message, `:hammer: ${reason}`)
  ]);
}

export async function reject_public(message: Discord.Message, reason: string): Promise<void> {
  await Promise.all([
    message.channel.send(`:hammer: <@!${message.author.id}>, ${reason}`),
    message.suppressEmbeds(true)
  ]);
}
