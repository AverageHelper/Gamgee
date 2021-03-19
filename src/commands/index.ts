import type Discord from "discord.js";
import type { Storage } from "../configStorage";

export { default as config } from "./config";
export { default as ping } from "./ping";
export { default as queue } from "./queue";
export { default as songRequest } from "./songRequest";
export { default as type } from "./type";
export { default as video } from "./video";

export interface Command {
  /** The string that triggers the command. */
  name: string;

  /** A user-readable description of what the command does. */
  description: string;

  /**
   * If the command has any sub-commands, or a more detailed explanation would
   * be necessary to describe the purpose of command arguments, this lists each
   * use case and an additional description. This array is printed when users
   * request the command tree.
   */
  uses?: Array<[string, string]>;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}

/**
 * Information relevant to a command invocation.
 */
export interface CommandContext {
  /** Gamgee's Discord client. */
  client: Discord.Client;

  /** The message that contains the command. */
  message: Discord.Message;

  /** The command and its arguments, with the command prefix stripped off. */
  args: string[];

  /** A `LocalStorage` instance scoped to the current guild. */
  storage: Storage | null;
}
