import type Discord from "discord.js";
import getUserFromMention from "./getUserFromMention";

export async function resolveUserFromOption(
  option: Discord.CommandInteractionOption,
  guild: Discord.Guild
): Promise<Discord.User | null> {
  if (option.type === "USER") {
    return option.user ?? null;
  }

  const userMention = option.value as string | undefined;
  if (userMention === undefined) return null;
  return (await getUserFromMention(guild, userMention)) ?? null;
}
