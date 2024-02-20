import { describe, expect, test, vi } from "vitest";

// Mock the client to track 'on' and 'once' calls
const mockOn = vi.fn();
const mockOnce = vi.fn();
const MockClient = vi.hoisted(
	() =>
		class MockClient {
			on = mockOn;
			once = mockOnce;
		}
);

vi.mock("discord.js", async () => ({
	...(await vi.importActual<typeof import("discord.js")>("discord.js")),
	Client: MockClient
}));

import { Client } from "discord.js";
const client = new Client({ intents: [] });

// Mock the logger so nothing is printed
import { useTestLogger } from "../../tests/testUtils/logger.js";
vi.mock("../logger.js", () => ({ useLogger: useTestLogger }));

// Import the unit under test
import { _add, allEventHandlers, registerEventHandlers } from "./index.js";

describe("allEventHandlers", () => {
	test("index is not empty", () => {
		expect(allEventHandlers.size).toBeGreaterThan(0);
	});

	test("fails to install another event handler with the same name", () => {
		const mockErrorHandler = { name: "error" } as unknown as EventHandler;
		expect(() => _add(mockErrorHandler)).toThrow(TypeError);
	});

	test("properly registers events", () => {
		// To test if event handler registration is working correctly,
		// this test creates fake handlers and then registers them,
		// and then checks that the client's registration methods were
		// given the correct fake event handler.

		// Clears all the canonical event handlers first, to isolate the test.
		// Casting a read-only value to a mutable value is bad practice except in test situations.
		// Don't do this at home.
		(allEventHandlers as Map<string, unknown>).clear(); // FIXME: Gotta be a way to isolate this better

		const fakeReadyEvent: EventHandler = {
			name: "ready",
			once: true,
			execute: () => undefined
		};
		const fakeMessageEvent: EventHandler = {
			name: "messageCreate",
			once: false,
			execute: () => undefined
		};
		expect(_add(fakeReadyEvent)).toBeUndefined();
		expect(_add(fakeMessageEvent)).toBeUndefined();

		expect(registerEventHandlers(client)).toBeUndefined();

		expect(mockOnce).toHaveBeenCalledWith(fakeReadyEvent.name, expect.any(Function));
		expect(mockOn).toHaveBeenCalledWith(fakeMessageEvent.name, expect.any(Function));
	});
});
