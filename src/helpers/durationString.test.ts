import type { SupportedLocale } from "../i18n.js";
import "../../tests/testUtils/leakedHandles.js";
import { durationString } from "./durationString.js";
import { expectValueEqual } from "../../tests/testUtils/expectations/jest.js";

// We don't test *every* locale we support, just a few edge cases.
// We mostly want to make sure that `humanize-duration` does
// something appropriate for each locale.

describe("Seconds to duration", () => {
	test.each`
		locale     | result
		${"en-US"} | ${"0 seconds"}
		${"es-ES"} | ${"0 segundos"}
		${"pt-BR"} | ${"0 segundos"}
		${"de"}    | ${"0 Sekunden"}
	`(
		"reports '$result' from zero in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 0), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"0 seconds"}
		${"es-ES"} | ${"0 segundos"}
		${"pt-BR"} | ${"0 segundos"}
		${"de"}    | ${"0 Sekunden"}
	`(
		"reports '$result' from small fraction in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 0.01), result);
			expectValueEqual(durationString(locale, 0.24), result);
			expectValueEqual(durationString(locale, 0.44), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"1 second"}
		${"es-ES"} | ${"1 segundo"}
		${"pt-BR"} | ${"1 segundo"}
		${"de"}    | ${"1 Sekunde"}
	`(
		"reports '$result' from small fraction in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 0.64), result);
			expectValueEqual(durationString(locale, 0.84), result);
			expectValueEqual(durationString(locale, 0.99), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"3 seconds"}
		${"es-ES"} | ${"3 segundos"}
		${"pt-BR"} | ${"3 segundos"}
		${"de"}    | ${"3 Sekunden"}
	`(
		"reports '$result' in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 3), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"30 seconds"}
		${"es-ES"} | ${"30 segundos"}
		${"pt-BR"} | ${"30 segundos"}
		${"de"}    | ${"30 Sekunden"}
	`(
		"reports '$result' in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 30), result);
			expectValueEqual(durationString(locale, 30.49), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"2 minutes"}
		${"es-ES"} | ${"2 minutos"}
		${"pt-BR"} | ${"2 minutos"}
		${"de"}    | ${"2 Minuten"}
	`(
		"reports '$result' in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 120), result);
		}
	);

	test.each`
		locale     | result
		${"en-US"} | ${"10 minutes"}
		${"es-ES"} | ${"10 minutos"}
		${"pt-BR"} | ${"10 minutos"}
		${"de"}    | ${"10 Minuten"}
	`(
		"reports '$result' in $locale",
		({ locale, result }: { locale: SupportedLocale; result: string }) => {
			expectValueEqual(durationString(locale, 600), result);
		}
	);
});
