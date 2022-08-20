import { startsWithVowel } from "./startsWithVowel.js";

/**
 * Returns `"a"` or `"an"`, as appropriate for the provided noun.
 *
 * @deprecated Use i18n APIs instead
 */
export function indefiniteArticle(noun: string): "a" | "an" {
	// eslint-disable-next-line deprecation/deprecation
	return startsWithVowel(noun) ? "an" : "a";
}
