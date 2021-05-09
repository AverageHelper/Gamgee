import type { CommandContext } from "../../Command";

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
