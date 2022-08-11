import { localizations, t } from "./i18n.js";
import enUS from "./locales/en-US.json";

describe("i18n", () => {
	describe("t", () => {
		test("returns strings for correct key-paths", () => {
			expect(t("commands.sr.name", "en-US")).toBe("sr");
		});

		test("throws on empty string", () => {
			expect(() => t("", "en-US")).toThrow(TypeError);
		});

		test("defaults to the value in en-US if there's no string for the given locale", () => {
			const value: string = t("test.something.only.english.would.have", "de");
			expect(value).toBe(enUS.test.something.only.english.would.have);
		});

		test("defaults to the keypath for a partial path", () => {
			const keypath = "test.something.only.english";
			const value: string = t(keypath, "en-US");
			expect(value).toBe(keypath);
		});

		test("defaults to the keypath if en-US is stumped", () => {
			const keypath = "nothing.should.have.this.string";
			expect(t(keypath, "de")).toBe(keypath);
			expect(t(keypath, "en-US")).toBe(keypath);
		});

		test("defaults to the keypath if the key is malformed", () => {
			const keypath = "nothing should have this string";
			expect(t(keypath, "de")).toBe(keypath);
			expect(t(keypath, "en-US")).toBe(keypath);
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
	});
});
