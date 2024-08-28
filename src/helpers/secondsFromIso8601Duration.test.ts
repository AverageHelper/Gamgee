import { describe, expect, test } from "vitest";
import { secondsFromIso8601Duration } from "./secondsFromIso8601Duration.js";
import { SECONDS_IN_HOUR } from "../constants/time.js";

describe("Converting ISO 8601 duration strings into number of seconds", () => {
	test.each([
		["PT0S", 0],
		["PT00S", 0],
		["PT0M00S", 0],
		["PT00M00S", 0],
		["PT5S", 5],
		["PT10S", 10],
		["PT90S", 90],
		["PT1M30S", 90],
		["PT01M30S", 90],
		["PT1H1M30S", SECONDS_IN_HOUR + 90],
	])("converts '%s' to %ds", (duration, seconds) => {
		expect(secondsFromIso8601Duration(duration)).toBe(seconds);
	});

	test.each([
		// Bandcamp's examples
		"P00H03M53S", // https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul
		"P00H04M37S", // https://forestrainmedia.com/track/bad-wolf
		"P00H02M50S", // https://lehtmojoe.bandcamp.com/track/were-not-going-home-dallas-stars-2020
	])("throws on non-standard string '%s'", duration => {
		expect(() => secondsFromIso8601Duration(duration)).toThrow(RangeError);
	});
});
