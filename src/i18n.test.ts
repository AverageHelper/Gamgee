import { localizations, t } from "./i18n.js";

describe("i18n", () => {
	const nonempty = "This string is empty in de, but not in en-US";
	const onlyInEnglish =
		"This is a string only found in English. This lets me test that language fallback works correctly.";
	const vocabulary = {
		de: {
			commands: {
				sr: {
					name: "sr"
				}
			},
			test: {
				nonempty: ""
			}
		},
		"en-US": {
			commands: {
				sr: {
					name: "sr"
				}
			},
			test: {
				empty: "",
				nonempty,
				only: {
					english: onlyInEnglish
				}
			}
		}
	};

	describe("t", () => {
		test("returns strings for correct key-paths", () => {
			expect(t("commands.sr.name", "en-US", vocabulary)).toBe("sr");
		});

		test("defaults to the value in en-US if there's no string for the given locale", () => {
			const value: string = t("test.only.english", "de", vocabulary);
			expect(value).toBe(onlyInEnglish);
		});

		test("defaults to the value in en-US if the string for the given locale is empty", () => {
			const value: string = t("test.nonempty", "de", vocabulary);
			expect(value).toBe(nonempty);
		});

		test("returns undefined on empty string", () => {
			expect(t("", "en-US")).toBeUndefined();
			expect(t("", "en-US", vocabulary)).toBeUndefined();
		});

		test("returns undefined when the value is an empty string", () => {
			// This also makes sure we don't enter an infinite recursive loop with locale fallbacks and empty values
			expect(t("test.empty", "en-US", vocabulary)).toBeUndefined();
			expect(t("test.empty", "de", vocabulary)).toBeUndefined();
		});

		test("returns undefined for a partial path", () => {
			const value: undefined = t("test.something.only.english", "en-US", vocabulary);
			expect(value).toBeUndefined();
		});

		test("returns undefined if en-US is stumped", () => {
			const keypath = "nothing.should.have.this.string";
			expect(t(keypath, "de", vocabulary)).toBeUndefined();
			expect(t(keypath, "en-US", vocabulary)).toBeUndefined();
		});

		test("returns undefined if the key is malformed", () => {
			const keypath = "nothing should have this string";
			expect(t(keypath, "de", vocabulary)).toBeUndefined();
			expect(t(keypath, "en-US", vocabulary)).toBeUndefined();
		});
	});

	describe("localizations", () => {
		test("returns strings for correct key-paths", () => {
			expect(localizations("commands.sr.name")).toMatchObject({
				de: "sr",
				"en-GB": "sr",
				"en-US": "sr",
				"es-ES": "sr",
				fr: "sr",
				hu: "sr",
				"pt-BR": "sr"
			});
			expect(localizations("commands.sr.description")).toMatchObject({
				de: "Senden Sie einen Song an die Warteschlange.",
				"en-GB": "Submit a song to the queue.",
				"en-US": "Submit a song to the queue.",
				"es-ES": "Envía una canción a la cola.",
				fr: "Soumettre une chanson à la file d'attente.",
				hu: "Adjon fel egy dalt a sorba.",
				"pt-BR": "Envie uma música para a fila."
			});
		});

		test("returns undefined for incorrect key-paths", () => {
			expect(localizations("")).toBeUndefined();
			expect(localizations("commands.sr")).toBeUndefined();
		});
	});
});
