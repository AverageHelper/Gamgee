import type { Range } from "./editMessage.js";
import "../../../tests/testUtils/leakedHandles.js";
import { expectValueEqual } from "../../../tests/testUtils/expectations/jest.js";
import { positionsOfUriInText, escapeUriInString, stopEscapingUriInString } from "./editMessage.js";

describe("Identifying URIs in strings", () => {
	test.each`
		msg                                                            | ranges
		${""}                                                          | ${null}
		${"nothing"}                                                   | ${null}
		${"still nothing"}                                             | ${null}
		${"https://nope"}                                              | ${null}
		${"https://yep.com"}                                           | ${[{ start: 0, end: 15 }]}
		${"https://yep.com at the start"}                              | ${[{ start: 0, end: 15 }]}
		${"at the end https://yep.com"}                                | ${[{ start: 11, end: 26 }]}
		${"at the end https://yep.com there is more text"}             | ${[{ start: 11, end: 26 }]}
		${"https://yep.com https://yep.com"}                           | ${[{ start: 0, end: 15 }, { start: 16, end: 31 }]}
		${"https://yep.com stuff https://yep.com"}                     | ${[{ start: 0, end: 15 }, { start: 22, end: 37 }]}
		${"starts https://yep.com and https://yep.com"}                | ${[{ start: 7, end: 22 }, { start: 27, end: 42 }]}
		${"https://yep.com then https://yep.com ends"}                 | ${[{ start: 0, end: 15 }, { start: 21, end: 36 }]}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${[{ start: 0, end: 15 }, { start: 16, end: 31 }, { start: 37, end: 52 }]}
	`(
		"correctly identifies URI substring range(s) in string '$msg'",
		({ msg, ranges }: { msg: string; ranges: NonEmptyArray<Range> | null }) => {
			expect(positionsOfUriInText(msg)).toStrictEqual(ranges);
		}
	);
});

describe("Suppressing Embeds", () => {
	test.each`
		msg                                                            | result
		${""}                                                          | ${""}
		${"doesn't need supression"}                                   | ${"doesn't need supression"}
		${"https://example.com"}                                       | ${"<https://example.com>"}
		${"https://example.com at the start"}                          | ${"<https://example.com> at the start"}
		${"at the end, https://example.com"}                           | ${"at the end, <https://example.com>"}
		${"ya know, https://example.com is neat"}                      | ${"ya know, <https://example.com> is neat"}
		${"https://yep.com https://yep.com"}                           | ${"<https://yep.com> <https://yep.com>"}
		${"https://yep.com stuff https://yep.com"}                     | ${"<https://yep.com> stuff <https://yep.com>"}
		${"starts https://yep.com and https://yep.com"}                | ${"starts <https://yep.com> and <https://yep.com>"}
		${"https://yep.com then https://yep.com ends"}                 | ${"<https://yep.com> then <https://yep.com> ends"}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"}
	`(
		"suppresses embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(escapeUriInString(msg), result);
		}
	);

	test.each`
		msg                                                                  | result
		${"<https://example.com>"}                                           | ${"<https://example.com>"}
		${"<https://example.com> at the start"}                              | ${"<https://example.com> at the start"}
		${"at the end, <https://example.com>"}                               | ${"at the end, <https://example.com>"}
		${"ya know, <https://example.com> is neat"}                          | ${"ya know, <https://example.com> is neat"}
		${"<https://yep.com> <https://yep.com>"}                             | ${"<https://yep.com> <https://yep.com>"}
		${"<https://yep.com> stuff <https://yep.com>"}                       | ${"<https://yep.com> stuff <https://yep.com>"}
		${"starts <https://yep.com> and <https://yep.com>"}                  | ${"starts <https://yep.com> and <https://yep.com>"}
		${"<https://yep.com> then <https://yep.com> ends"}                   | ${"<https://yep.com> then <https://yep.com> ends"}
		${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"} | ${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"}
	`(
		"doesn't re-suppress embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(escapeUriInString(msg), result);
		}
	);
});

describe("Allowing Embeds", () => {
	test.each`
		msg                                                                  | result
		${""}                                                                | ${""}
		${"doesn't need fixing"}                                             | ${"doesn't need fixing"}
		${"<https://example.com>"}                                           | ${"https://example.com"}
		${"<https://example.com> at the start"}                              | ${"https://example.com at the start"}
		${"at the end, <https://example.com>"}                               | ${"at the end, https://example.com"}
		${"ya know, <https://example.com> is neat"}                          | ${"ya know, https://example.com is neat"}
		${"<https://yep.com> <https://yep.com>"}                             | ${"https://yep.com https://yep.com"}
		${"<https://yep.com> stuff <https://yep.com>"}                       | ${"https://yep.com stuff https://yep.com"}
		${"starts <https://yep.com> and <https://yep.com>"}                  | ${"starts https://yep.com and https://yep.com"}
		${"<https://yep.com> then <https://yep.com> ends"}                   | ${"https://yep.com then https://yep.com ends"}
		${"<https://yep.com> <https://yep.com> then <https://yep.com> ends"} | ${"https://yep.com https://yep.com then https://yep.com ends"}
	`(
		"frees embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(stopEscapingUriInString(msg), result);
		}
	);

	test.each`
		msg                                                            | result
		${"https://example.com"}                                       | ${"https://example.com"}
		${"https://example.com at the start"}                          | ${"https://example.com at the start"}
		${"at the end, https://example.com"}                           | ${"at the end, https://example.com"}
		${"ya know, https://example.com is neat"}                      | ${"ya know, https://example.com is neat"}
		${"https://yep.com https://yep.com"}                           | ${"https://yep.com https://yep.com"}
		${"https://yep.com stuff https://yep.com"}                     | ${"https://yep.com stuff https://yep.com"}
		${"starts https://yep.com and https://yep.com"}                | ${"starts https://yep.com and https://yep.com"}
		${"https://yep.com https://yep.com then https://yep.com ends"} | ${"https://yep.com https://yep.com then https://yep.com ends"}
	`(
		"doesn't re-free embeds from message content: '$msg'",
		({ msg, result }: { msg: string; result: string }) => {
			expectValueEqual(stopEscapingUriInString(msg), result);
		}
	);
});
