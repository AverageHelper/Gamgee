import type { Interaction, LocaleString } from "discord.js";

// TODO: We should only hold this info for 90 days at most, unless refreshed.
const lastKnownUserLocales = new Map<string, LocaleString>();

/**
 * Associates an interaction's user with their locale at the time.
 */
export function cacheLocaleFromInteraction(interaction: Interaction): void {
	const userId = interaction.user.id;
	const locale = interaction.locale;
	lastKnownUserLocales.set(userId, locale);
}

/**
 * Returns a locale for the given user, based on what was last known about them.
 *
 * @param userId The user whose locale to look up.
 * @returns A locale string if one is known for the user. `null` otherwise.
 */
export function lastKnownLocaleForUser(userId: string): LocaleString | null {
	return lastKnownUserLocales.get(userId) ?? null;
}
