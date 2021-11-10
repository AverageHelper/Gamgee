/**
 * Returns the first word in the given string, delimited by a normal whitespace (` `) character.
 */
export function firstWord(str: string): string {
	if (typeof str !== "string") return "";
	return str.slice(0, Math.max(0, str.indexOf(" ")));
}
