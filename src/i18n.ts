/* eslint-disable @typescript-eslint/no-var-requires */

// ** Install language files here **
const vocabulary = {
	de: require("./locales/de.json") as typeof import("./locales/de.json"),
	"en-GB": require("./locales/en-GB.json") as typeof import("./locales/en-GB.json"),
	"en-US": require("./locales/en-US.json") as typeof import("./locales/en-US.json"),
	"es-ES": require("./locales/es-ES.json") as typeof import("./locales/es-ES.json"),
	fr: require("./locales/fr.json") as typeof import("./locales/fr.json"),
	hu: require("./locales/hu.json") as typeof import("./locales/hu.json"),
	"pt-BR": require("./locales/pt-BR.json") as typeof import("./locales/pt-BR.json")
} as const;

/* eslint-disable @typescript-eslint/no-var-requires */

const DEFAULT_LOCALE = "en-US";

export type SupportedLocale = keyof typeof vocabulary;

export const locales = Object.keys(vocabulary) as ReadonlyArray<SupportedLocale>;

/** Returns `true` if the given string matches a supported locale code. */
export function isSupportedLocale(tbd: unknown): tbd is SupportedLocale {
	return locales.includes(tbd as SupportedLocale);
}

// TODO: Validate that all of our strings files match the master schema
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
 * Returns `keypath` if no matching translation exists.
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
