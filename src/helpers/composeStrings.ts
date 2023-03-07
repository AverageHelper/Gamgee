export type PartialString = Array<string>;

export function createPartialString(initialValue?: string): PartialString {
	if (initialValue === undefined) return [];
	return [initialValue];
}

/**
 * Appends a string to a partial string.
 * @param str The string to append.
 */
export function push(str: string, partial: PartialString): void {
	if (!str) return; // ignore empty strings
	partial.push(str);
}

/**
 * Appends a string with Markdown bold formatting.
 * @param str The string to embolden.
 */
export function pushBold(str: string, partial: PartialString): void {
	push(bold(str), partial);
}

export function bold<S extends string>(str: S): `**${S}**` {
	return `**${str}**`;
}

/**
 * Appends a string with Markdown inline-code formatting.
 * @param str The string to codify.
 */
export function pushCode(str: string, partial: PartialString): void {
	push(code(str), partial);
}

export type Code<S extends string> = `\`${S}\``;

export function code<S extends string>(str: S): Code<S> {
	return `\`${str}\``;
}

/**
 * Appends a newline character to the partial string.
 *
 * Identical to calling `push("\n", partial)`.
 */
export function pushNewLine(partial: PartialString): void {
	push("\n", partial);
}

/**
 * Appends a single space character to the partial string.
 *
 * Identical to calling `push(" ", partial)`.
 */
export function pushSpace(partial: PartialString): void {
	push(" ", partial);
}

/**
 * Returns a new string from the partial string's contents.
 * @returns The composed string.
 */
export function composed(partial: PartialString): string {
	return partial.join("");
}
