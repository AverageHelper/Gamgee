import { describe, expect, test } from "vitest";
import { onEvent } from "./onEvent.js";

describe("Creating event handlers", () => {
	// We shouldn't have to worry about testing with poorly-formatted arguments.
	// Since this is an internal tool, not one for a public SDK, we expect
	// TypeScript to yell at any dev silly enough to include too many or too
	// few arguments, or arguments of the wrong type.

	test("creates a proper event handler", () => {
		const execute = (): void => undefined;
		const handler = onEvent("ready", {
			once: true,
			execute
		});
		expect(handler).toBeDefined();
		expect(handler).toHaveProperty("name", "ready");
		expect(handler).toHaveProperty("once", true);
		expect(handler).toHaveProperty("execute", execute);
	});
});
