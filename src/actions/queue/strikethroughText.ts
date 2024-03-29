import { addCharactersAround } from "./wrappedText.js";
import { removeCharactersAround } from "./unwrappedText.js";

/**
 * Adds Markdown strikethrough markers to the string.
 *
 * @param straightText The text without strikethrough.
 * @returns The given text, with strikethrough.
 */
export function addStrikethrough(straightText: string): string {
	return addCharactersAround(straightText, "~~");
}

/**
 * Removes Markdown strikethrough markers from the string.
 *
 * @param strickenText The text with strikethrough.
 * @returns The given text, sans strikethrough.
 */
export function removeStrikethrough(strickenText: string): string {
	return removeCharactersAround(strickenText, "~~");
}
