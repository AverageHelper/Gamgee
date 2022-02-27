import type { PartialString } from "./composeStrings";
import {
	composed,
	createPartialString,
	pushBold,
	pushCode,
	pushNewLine,
	push
} from "./composeStrings";

describe("String Builder", () => {
	let partial: PartialString;

	beforeEach(() => {
		partial = createPartialString();
	});

	test("builds an empty string", () => {
		expect(composed(partial)).toBe("");
	});

	test("builds an empty string after empty push", () => {
		push("", partial);
		expect(composed(partial)).toBe("");
	});

	test("builds a single-character string from init", () => {
		partial = createPartialString("a");
		expect(composed(partial)).toBe("a");
	});

	test("builds a single-character string from push", () => {
		push("a", partial);
		expect(composed(partial)).toBe("a");
	});

	test("builds the same string after two `result` calls", () => {
		push("a", partial);
		composed(partial);
		expect(composed(partial)).toBe("a");
	});

	test("builds an empty string after clear", () => {
		push("a", partial);
		expect(composed(partial)).toBe("a");
		partial = createPartialString();
		expect(composed(partial)).toBe("");
	});

	test("builds a newline from pushNewLine", () => {
		pushNewLine(partial);
		expect(composed(partial)).toBe("\n");
	});

	test("builds a string with spaces", () => {
		push("This ", partial);
		push("sentence ", partial);
		push("is ", partial);
		push("false!", partial);
		expect(composed(partial)).toBe("This sentence is false!");
	});

	describe("Markdown Formatting", () => {
		test("builds a bold string", () => {
			push("For the ", partial);
			pushBold("bold", partial);
			push("!", partial);
			expect(composed(partial)).toBe("For the **bold**!");
		});

		test("builds a code string", () => {
			push("Please run the ", partial);
			pushCode("?help", partial);
			push(" command.", partial);
			expect(composed(partial)).toBe("Please run the `?help` command.");
		});
	});
});
