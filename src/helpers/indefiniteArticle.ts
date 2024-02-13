/**
 * Returns `"a"` or `"an"`, as appropriate for the provided noun.
 *
 * Note: Should only be used in English contexts.
 */
export function indefiniteArticle(noun: string): "a" | "an" {
	// eslint-disable-next-line deprecation/deprecation
	return startsWithVowel(noun) ? "an" : "a";
}

/**
 * Returns `true` if the provided string starts with an English vowel.
 *
 * Note: Should only be used in English contexts.
 */
function startsWithVowel(str: string): boolean {
	if (typeof str !== "string") return false;
	const first = str[0];
	if (first === undefined) return false;
	return ["a", "e", "i", "o", "u"].includes(first.toLowerCase());
}
