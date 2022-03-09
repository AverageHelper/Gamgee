import { startsWithVowel } from "./startsWithVowel.js";

/**
 * Returns `"a"` or `"an"`, as appropriate for the provided noun.
 */
export function indefiniteArticle(noun: string): "a" | "an" {
	return startsWithVowel(noun) ? "an" : "a";
}
