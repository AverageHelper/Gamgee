import type Discord from "discord.js";
import type { Storage } from "../configStorage";

export { default as config } from "./config";
export { default as help } from "./help";
export { default as ping } from "./ping";
export { default as songRequest } from "./songRequest";
export { default as type } from "./type";
export { default as video } from "./video";

/**
 * Information relevant to a command invocation.
 */
export interface CommandContext {
  /** Gamgee's Discord client. */
  client: Discord.Client;

  /** The message that contains the command. */
  message: Discord.Message;

  /** The command arguments. */
  args: Array<string>;

  /** A `LocalStorage` instance scoped to the current guild. */
  storage: Storage | null;
}

interface Subcommand {
  /** A user-readable description of what the command does. */
  description: string;

  /** A user-readable format for a required argument. */
  requiredArgFormat?: string;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}

export interface ArbitrarySubcommand extends Subcommand {
  /** The user-readable format of the user input to pass to the command. */
  format: string;
}

export interface NamedSubcommand extends Subcommand {
  /** The string that triggers the command. */
  name: string;
}

/**
 * A top-level command description.
 */
export interface Command {
  /** The string that triggers the command. */
  name: string;

  /** A user-readable description of what the command does. */
  description: string;

  /** A user-readable format for a required argument. */
  requiredArgFormat?: string;

  /** An array of subcommands with predefined activation trigger words. */
  namedSubcommands?: Array<NamedSubcommand>;

  /** A subcommand which may be activated by any string that doesn't match one of the named subcommands first. */
  arbitrarySubcommand?: ArbitrarySubcommand;

  /**
   * The command implementation. Receives contextual information about the
   * command invocation. May return a `Promise`.
   *
   * @param context Contextual information about the command invocation.
   */
  execute: (context: CommandContext) => void | Promise<void>;
}
