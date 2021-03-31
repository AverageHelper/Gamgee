import type Discord from "discord.js";

/**
 * Creates a user-identifying string that can be logged to the console.
 *
 * @param user The user to log.
 * @returns a string of the form `"{user ID} ({username})"`
 */
export default function logUser(user: Discord.User): string {
  return `${user.id} (${user.username})`;
}
