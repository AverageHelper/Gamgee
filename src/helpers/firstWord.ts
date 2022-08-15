/**
 * Returns the first word in the given string, delimited by a normal whitespace (` `) character.
 */
export function firstWord(str: string): string {
	// FIXME: Might not work in non-Roman locales
	if (typeof str !== "string") return "";
	return str.slice(0, Math.max(0, str.indexOf(" ")));
}
