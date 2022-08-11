import de from "./locales/de.json";
import enGB from "./locales/en-GB.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";
import fr from "./locales/fr.json";
import hu from "./locales/hu.json";
import ptBR from "./locales/pt-BR.json";

const messages = {
	de,
	"en-GB": enGB,
	"en-US": enUS,
	"es-ES": esES,
	fr,
	hu,
	"pt-BR": ptBR
} as const;

export type SupportedLocale = keyof typeof messages;

/** Returns `true` if the given string matches a supported locale code. */
export function isSupportedLocale(tbd: string | null): tbd is SupportedLocale {
	return tbd !== null && Object.keys(messages).includes(tbd);
}

const DEFAULT_LOCALE = "en-US";

// TODO: Validate that all of our strings files match the master schema
// TypeScript ensures here that DEFAULT_LOCALE is a valid locale:
type MessageSchema = typeof messages[typeof DEFAULT_LOCALE];

// ** I18N Utilities **

import type { Get, Join, Split } from "type-fest";
import _get from "lodash/get";
import isString from "lodash/isString";

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

// FIXME: We shouldn't need to overload this
export function t<K extends string>(keypath: K, locale: SupportedLocale): string | undefined {
	if (keypath === "") return undefined;

	const result = get<MessageSchema, Split<K, typeof DOT>>(
		messages[locale] as MessageSchema,
		split(keypath, DOT)
	);

	if (isString(result)) return result; // found a result in the given locale!

	if (locale !== DEFAULT_LOCALE) {
		// recurse, try the default locale:
		return t(keypath, DEFAULT_LOCALE);
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

	Object.keys(messages).forEach(locale => {
		if (!isSupportedLocale(locale)) return;
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

const commands: MessageSchema[typeof p0] = messages["en-US"][p0];
const sr: MessageSchema[typeof p0][typeof p1] = messages["en-US"][p0][p1];
const name: MessageSchema[typeof p0][typeof p1][typeof p2] = t(given, "en-US");

type IsKeyPath<O, K extends string> = Get<O, K> extends string ? true : false;

declare const good: IsKeyPath<MessageSchema, typeof given>;
declare const bad: IsKeyPath<MessageSchema, "typeof given">;
