import type { PartialString } from "./composeStrings.js";
import { beforeEach, describe, test } from "vitest";
import { expectValueEqual } from "../../tests/testUtils/expectations.js";
import {
	composed,
	createPartialString,
	pushBold,
	pushCode,
	pushNewLine,
	push,
} from "./composeStrings.js";

describe("String Builder", () => {
	let partial: PartialString;

	beforeEach(() => {
		partial = createPartialString();
	});

	test("builds an empty string", () => {
		expectValueEqual(composed(partial), "");
	});

	test("builds an empty string after empty push", () => {
		push("", partial);
		expectValueEqual(composed(partial), "");
	});

	test("builds a single-character string from init", () => {
		partial = createPartialString("a");
		expectValueEqual(composed(partial), "a");
	});

	test("builds a single-character string from push", () => {
		push("a", partial);
		expectValueEqual(composed(partial), "a");
	});

	test("builds the same string after two `result` calls", () => {
		push("a", partial);
		composed(partial);
		expectValueEqual(composed(partial), "a");
	});

	test("builds an empty string after clear", () => {
		push("a", partial);
		expectValueEqual(composed(partial), "a");
		partial = createPartialString();
		expectValueEqual(composed(partial), "");
	});

	test("builds a newline from pushNewLine", () => {
		pushNewLine(partial);
		expectValueEqual(composed(partial), "\n");
	});

	test("builds a string with spaces", () => {
		push("This ", partial);
		push("sentence ", partial);
		push("is ", partial);
		push("false!", partial);
		expectValueEqual(composed(partial), "This sentence is false!");
	});

	describe("Markdown Formatting", () => {
		test("builds a bold string", () => {
			push("For the ", partial);
			pushBold("bold", partial);
			push("!", partial);
			expectValueEqual(composed(partial), "For the **bold**!");
		});

		test("builds a code string", () => {
			push("Please run the ", partial);
			pushCode("?help", partial);
			push(" command.", partial);
			expectValueEqual(composed(partial), "Please run the `?help` command.");
		});
	});
});
