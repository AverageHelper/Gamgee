/**
 * Returns `true` if the provided string starts with an English vowel.
 */
export function startsWithVowel(str: string): boolean {
	if (typeof str !== "string") return false;
	const first = str[0];
	if (first === undefined) return false;
	return ["a", "e", "i", "o", "u"].includes(first.toLowerCase());
}
