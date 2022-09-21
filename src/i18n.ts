import de from "./locales/de.json";
import enGB from "./locales/en-GB.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";
import fr from "./locales/fr.json";
import hu from "./locales/hu.json";
import ptBR from "./locales/pt-BR.json";

// ** Install language files here **
const vocabulary = {
	de,
	"en-GB": enGB,
	"en-US": enUS,
	"es-ES": esES,
	fr,
	hu,
	"pt-BR": ptBR
} as const;

export const DEFAULT_LOCALE = "en-US";

export type SupportedLocale = keyof typeof vocabulary;

export interface LocaleMetadata {
	code: string;
	name: string;
	nickname: string;
}

export const locales = Object.keys(vocabulary) as ReadonlyArray<SupportedLocale>;

/** Returns `true` if the given string matches a supported locale code. */
export function isSupportedLocale(tbd: unknown): tbd is SupportedLocale {
	return locales.includes(tbd as SupportedLocale);
}

/** Returns the given locale if we support that locale. Returns `null` otherwise. */
export function localeIfSupported(tbd: unknown): SupportedLocale | null {
	if (!isSupportedLocale(tbd)) return null;
	return tbd;
}

export function randomSupportedLocale(): SupportedLocale {
	return randomElementOfArray(locales.slice()) ?? DEFAULT_LOCALE;
}

export function metadataForLocale(locale: SupportedLocale): LocaleMetadata {
	return vocabulary[locale].meta;
}

import type { Guild } from "discord.js";

/** Returns the unit's preferred locale, if supported, or the default locale if not. */
export function preferredLocale(guild: Pick<Guild, "preferredLocale">): SupportedLocale {
	return localeIfSupported(guild.preferredLocale) ?? DEFAULT_LOCALE;
}

// TypeScript ensures here that DEFAULT_LOCALE is a valid locale:
type MessageSchema = typeof vocabulary[typeof DEFAULT_LOCALE];

// ** I18N Utilities **

interface RecursiveStringRecord extends Record<string, string | RecursiveStringRecord> {}

// for testing i18n over generic vocabularies
type Vocabulary = {
	[DEFAULT_LOCALE]: RecursiveStringRecord;
} & {
	[P in Exclude<SupportedLocale, typeof DEFAULT_LOCALE>]?: RecursiveStringRecord;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: Vocabulary = vocabulary; // ensures our language types are formatted right

import type { Get, Split } from "type-fest";
import _get from "lodash/get.js";
import isString from "lodash/isString.js";

function split<S extends string, D extends string>(string: S, separator: D): Split<S, D> {
	return string.split(separator) as Split<S, D>;
}

const get = <BaseType, Path extends string | ReadonlyArray<string>>(
	object: BaseType,
	path: Path
): Get<BaseType, Path> => _get(object, path) as Get<BaseType, Path>;

const DOT = ".";

/**
 * Returns the given `locale`'s translation for the given `keypath`.
 *
 * If the given `locale` does not contain a matching translation,
 * but the default locale does, then that translation is returned.
 *
 * Returns `keypath` if no matching translation exists.
 */
export function t<K extends string>(
	keypath: K,
	locale: SupportedLocale
): Get<MessageSchema, K> extends string ? Get<MessageSchema, K> : undefined;

/**
 * Returns the given `locale`'s translation for the given `keypath`.
 *
 * If the given `locale` does not contain a matching translation,
 * but the default locale does, then that translation is returned.
 *
 * Returns `undefined` if no matching translation exists.
 */
export function t<K extends string, V extends Vocabulary>(
	keypath: K,
	locale: SupportedLocale,
	messages: V
): Get<V[typeof DEFAULT_LOCALE], K> extends string ? Get<V[typeof DEFAULT_LOCALE], K> : undefined;

// FIXME: We shouldn't need to overload this
export function t<K extends string>(
	keypath: K,
	locale: SupportedLocale,
	data = vocabulary
): string | undefined {
	if (keypath === "") return undefined;

	const result = get(data[locale], split(keypath, DOT));

	if (isString(result) && result) return result; // found a result in the given locale!

	if (locale !== DEFAULT_LOCALE) {
		// recurse, try the default locale:
		return t(keypath, DEFAULT_LOCALE, data);
	}

	return undefined; // we're stumped, return nothing
}

export { t as translate };

import { composed, createPartialString, push } from "./helpers/composeStrings.js";
import { randomElementOfArray } from "./helpers/randomElementOfArray.js";

/**
 * Returns the given `locale`'s translation for the given `keypath`,
 * while interpolating the given `values` into their respective placeholders.
 *
 * If the given `locale` does not contain a matching translation,
 * but the default locale does, then that translation is returned.
 *
 * Returns `undefined` if no matching translation exists.
 */
export function ti<K extends string>(
	keypath: K,
	values: Record<string, string>,
	locale: SupportedLocale
): Get<MessageSchema, K> extends string ? string : undefined;

// FIXME: We shouldn't need to overload this
export function ti<K extends string>(
	keypath: K,
	values: Record<string, string>,
	locale: SupportedLocale
): string | undefined {
	const rawText: string | undefined = t(keypath, locale);
	if (rawText === undefined || rawText === "") return rawText;

	// Parse out text and variable names
	interface SlotItem {
		/** `true` if the item should render some slotted data. */
		isVar: true;
		/** The name of the variable. */
		name: string;
	}

	interface TextItem {
		/** `true` if the item should render some slotted data. */
		isVar: false;
		/** Text to render. */
		text: string;
	}

	type Item = SlotItem | TextItem;

	const items: Array<Item> = [];

	let mode: "discovery" | "text" | "slot" = "discovery";
	let text = "";
	for (const char of rawText) {
		if (char === "{" && mode !== "slot") {
			if (mode === "text") {
				// Finish text node
				items.push({ isVar: false, text });
			}
			// Start variable name
			text = "";
			mode = "slot";
		} else if (char === "}" && mode === "slot") {
			// We've hit the end of a variable name
			if (text === "") {
				// but the brackets were empty. Treat that as a text node
				items.push({ isVar: false, text: "{}" });
			} else {
				items.push({ isVar: true, name: text });
			}
			text = "";
			mode = "discovery";
		} else if (mode === "slot") {
			// Continue variable name
			text += char;
		} else {
			// Continue text
			text += char;
			mode = "text";
		}
	}
	if (text !== "") {
		if (mode === "text") {
			// Finished, but there's some string left
			items.push({ isVar: false, text });
		} else if (mode === "slot") {
			// Finished, but we ended with an incomplete variable. Push it as text
			text = `{${text}`; // make sure to include the variable starter
			items.push({ isVar: false, text });
		}
	}

	// Combine items, mixing given values for variables if given
	const partial = createPartialString();

	for (const item of items) {
		let str: string;
		if (item.isVar) {
			str = values[item.name] ?? `{${item.name}}`; // default to the raw variable name
		} else {
			str = item.text;
		}
		push(str, partial);
	}

	return composed(partial);
}

export { ti as translateInterpolating };

/**
 * Returns an object with every translation we have for the given `keypath`,
 * or `undefined` if no translations exist.
 */
export function localizations<K extends string>(
	keypath: K
): Get<MessageSchema, K> extends string ? Partial<Record<SupportedLocale, string>> : undefined;

// FIXME: We shouldn't need to overload this
export function localizations<K extends string>(
	keypath: K
): Partial<Record<SupportedLocale, string>> | undefined {
	// Get all localizations for the given keypath
	const result: Partial<Record<SupportedLocale, string>> = {};

	locales.forEach(locale => {
		const translation = t(keypath, locale);
		if (translation !== undefined) {
			// only add the translation if there is one to add
			result[locale] = translation;
		}
	});

	// Return undefined if there were no results
	if (Object.keys(result).length === 0) return undefined;
	return result;
}

// For science:
/* eslint-disable @typescript-eslint/no-unused-vars */
// const enUS = vocabulary["en-US"];

/*
import type { Join } from "type-fest";

// We start with this at dev time, typing into a function:
const given = "commands.sr.name";

// Goal: Confirm that a given string makes up a valid key-path in a given object.

// Split given by DOT:
const p: ["commands", "sr", "name"] = split(given, DOT);

// const testBad: string = get(enUS, "commands.sr."); // Error
const testGood: string = get(enUS, "commands.sr.name");
const testAlsoBad: string = get(enUS, ["commands", "sr"]);
const testAlsoGood: string = get(enUS, p);

// If we can split `given` by a DOT "." we get these values:
const p0: "commands" = p[0];
const p1: "sr" = p[1];
const p2: "name" = p[2];

// We can recombine segments with this:
type Path<L extends string, R extends string, Sep extends string = typeof DOT> = Join<[L, R], Sep>;

const partial: Path<typeof p0, typeof p1> = `${p0}.${p1}`;

// these values are equivalent to `given`:
const path: Path<Path<typeof p0, typeof p1>, typeof p2> = given;
const alsoPath: Join<typeof p, typeof DOT> = given;

const commands: MessageSchema[typeof p0] = vocabulary["en-US"][p0];
const sr: MessageSchema[typeof p0][typeof p1] = vocabulary["en-US"][p0][p1];
const name: MessageSchema[typeof p0][typeof p1][typeof p2] = t(given, "en-US");

type IsKeyPath<O, K extends string> = Get<O, K> extends string ? true : false;

const good: IsKeyPath<MessageSchema, typeof given> = true;
const bad: IsKeyPath<MessageSchema, "typeof given"> = false;
*/
