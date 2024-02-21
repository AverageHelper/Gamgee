/**
 * Adds a prefix and postfix to a string.
 *
 * @param straightText The text without pre/postfix.
 * @param prefix Characters to remove from the start of the text.
 * @param postfix Characters to remove from the end of the text. Defaults to the value of `prefix`.
 *
 * @returns The given text, without the stated pre- and postfix.
 */
export function removeCharactersAround(
	dirtyText: string,
	prefix: string,
	postfix?: string,
): string {
	if (!dirtyText) return dirtyText;
	if (!dirtyText.startsWith(prefix) || !dirtyText.endsWith(postfix ?? prefix)) {
		return dirtyText;
	}
	return dirtyText.slice(prefix.length, -(postfix ?? prefix).length);
}
