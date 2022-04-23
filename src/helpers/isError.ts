import { DiscordAPIError } from "discord.js";

/**
 * Asserts that a value is a NodeJS error.
 *
 * @param tbd The value to check.
 * @returns a boolean value indicating whether the provided value is an `Error`.
 */
export function isError(tbd: unknown): tbd is NodeJS.ErrnoException {
	return tbd instanceof Error;
}

/**
 * Asserts that a value is a Discord API error.
 *
 * @param tbd The value to check.
 * @returns a boolean value indicating whether the provided value is a `DiscordAPIError`.
 */
export function isDiscordError(tbd: unknown): tbd is DiscordAPIError {
	return tbd instanceof DiscordAPIError;
}
