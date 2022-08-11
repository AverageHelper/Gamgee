import { localizations, t } from "./i18n.js";
import enUS from "./locales/en-US.json";

describe("i18n", () => {
	describe("t", () => {
		test("returns strings for correct key-paths", () => {
			expect(t("commands.sr.name", "en-US")).toBe("sr");
		});

		test("defaults to the value in en-US if there's no string for the given locale", () => {
			const value: string = t("test.something.only.english.would.have", "de");
			expect(value).toBe(enUS.test.something.only.english.would.have);
		});

		test("returns undefined on empty string", () => {
			expect(t("", "en-US")).toBeUndefined();
		});

		test("returns undefined for a partial path", () => {
			const value: undefined = t("test.something.only.english", "en-US");
			expect(value).toBeUndefined();
		});

		test("returns undefined if en-US is stumped", () => {
			const keypath = "nothing.should.have.this.string";
			expect(t(keypath, "de")).toBeUndefined();
			expect(t(keypath, "en-US")).toBeUndefined();
		});

		test("returns undefined if the key is malformed", () => {
			const keypath = "nothing should have this string";
			expect(t(keypath, "de")).toBeUndefined();
			expect(t(keypath, "en-US")).toBeUndefined();
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
