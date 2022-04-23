import { durationString } from "./durationString.js";

describe("Seconds to duration", () => {
	test("reports 0 seconds from zero", () => {
		expect(durationString(0)).toBe("0 seconds");
	});

	test("reports 0 seconds from small fraction", () => {
		expect(durationString(0.01)).toBe("0 seconds");
		expect(durationString(0.24)).toBe("0 seconds");
		expect(durationString(0.44)).toBe("0 seconds");
	});

	test("reports 1 second from small fraction", () => {
		expect(durationString(0.64)).toBe("1 second");
		expect(durationString(0.84)).toBe("1 second");
		expect(durationString(0.99)).toBe("1 second");
	});

	test("reports 3 seconds", () => {
		expect(durationString(3)).toBe("3 seconds");
	});

	test("reports 30 seconds", () => {
		expect(durationString(30)).toBe("30 seconds");
		expect(durationString(30.49)).toBe("30 seconds");
	});

	test("reports 2 minutes", () => {
		expect(durationString(120)).toBe("2 minutes");
	});

	test("reports 10 minutes", () => {
		expect(durationString(600)).toBe("10 minutes");
	});
});
