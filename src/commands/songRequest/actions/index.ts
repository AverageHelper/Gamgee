import type Discord from "discord.js";
import type { CommandContext } from "../../Command";
import { replyPrivately } from "../../../actions/messages";

export async function reply(
  message: Discord.Message | Discord.CommandInteraction,
  content: string,
  allowMentions: boolean = true
): Promise<void> {
  if (allowMentions) {
    await message.reply(content);
  } else {
    await message.reply(content, { allowedMentions: { users: [] } });
  }
}

export async function reply_private(message: Discord.Message, content: string): Promise<void> {
  await replyPrivately(message, content);
}

export async function replyInChannel(
  source: Discord.Message | Discord.CommandInteraction,
  content: string
): Promise<void> {
  if ("author" in source) {
    await source.channel.send(content);
  } else {
    await source.reply(content);
  }
}

export async function replyToCommandInChannel(
  context: CommandContext,
  content: string
): Promise<void> {
  if (context.type === "interaction") {
    return replyInChannel(context.interaction, content);
  }
  return replyInChannel(context.message, content);
}

export function startTypingInChannelFromCommand(context: CommandContext): void {
  if (context.type === "interaction") {
    if (context.interaction.channel?.isText() === true) {
      void (context.interaction.channel as
        | Discord.TextChannel
        | Discord.DMChannel
        | Discord.NewsChannel).startTyping();
    }
    return;
  }
  return void context.message.channel.startTyping();
}

export function stopTypingInChannelFromCommand(context: CommandContext): void {
  if (context.type === "interaction") {
    if (context.interaction.channel?.isText() === true) {
      void (context.interaction.channel as
        | Discord.TextChannel
        | Discord.DMChannel
        | Discord.NewsChannel).stopTyping(true);
    }
    return;
  }
  return void context.message.channel.stopTyping(true);
}

export async function reject_private(context: CommandContext, reason: string): Promise<void> {
  await Promise.all([
    context.deleteInvocation(), //
    context.replyPrivately(`:hammer: ${reason}`)
  ]);
}

export async function reject_public(context: CommandContext, reason: string): Promise<void> {
  await context.reply(`:hammer: ${reason}`);
  if (context.type === "message") {
    await context.message.suppressEmbeds(true);
  }
}
