import type { SupportedLocale } from "../i18n.js";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";
import { t } from "../i18n.js";
import humanize from "humanize-duration";

function shortDurationString(locale: SupportedLocale, seconds: number): string {
	if (Number.isNaN(seconds)) return t("common.count.not-a-number", locale);
	if (!Number.isFinite(seconds)) return t("common.count.infinity", locale);
	if (typeof seconds !== "number" || seconds === undefined)
		return t("common.count.not-a-number", locale);
	return new Date(1000 * seconds).toISOString().slice(11, 19);
}

/**
 * Returns a string representing the given number of seconds in a
 * natural format to express lengths of time.
 *
 * @param locale The locale to which to translate the string.
 * @param seconds The number of seconds to format.
 * @param short Whether the resulting string should be in a short format.
 *
 * @returns A user-readable string describing the number of seconds.
 */
export function durationString(
	locale: SupportedLocale,
	seconds: number,
	short: boolean = false
): string {
	if (short) {
		return shortDurationString(locale, seconds);
	}
	if (Number.isNaN(seconds)) return t("common.count.seconds-nan", locale);
	if (!Number.isFinite(seconds)) return t("common.count.seconds-infinity", locale);
	if (typeof seconds !== "number" || seconds === undefined)
		return t("common.count.seconds-nan", locale);

	// `humanize-duration` doesn't use the same list of locales that we do, so we must translate
	// See https://github.com/EvanHahn/HumanizeDuration.js#supported-languages
	let language: string;
	switch (locale) {
		case "en-GB":
		case "en-US":
			language = "en";
			break;
		case "es-ES":
			language = "es";
			break;
		case "pt-BR":
			language = "pt";
			break;
		case "de":
		case "fr":
		case "hu":
			language = locale;
			break;
	}
	return humanize(seconds * MILLISECONDS_IN_SECOND, { round: true, language, fallbacks: ["en"] });
}
