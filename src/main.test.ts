import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Mock the client to track constructor and 'login' calls
const mockConstructClient = vi.fn();
const mockLogin = vi.fn();
const MockClient = vi.hoisted(
	() =>
		class MockClient {
			login = mockLogin;

			constructor(...args: ReadonlyArray<unknown>) {
				mockConstructClient(...args);
			}
		}
);

vi.mock("discord.js", async () => ({
	...(await vi.importActual<typeof import("discord.js")>("discord.js")),
	Client: MockClient
}));

// Don't test against the production token
const mockToken = "TEST_TOKEN";
process.env["DISCORD_TOKEN"] = mockToken;

// Mock the event handler index so we can track it
vi.mock("./events/index.js");
import { registerEventHandlers } from "./events/index.js";
const mockRegisterEventHandlers = registerEventHandlers as Mock<
	Parameters<typeof registerEventHandlers>,
	ReturnType<typeof registerEventHandlers>
>;

// Mock the logger to track output
import type { Logger } from "./logger.js";
const mockLoggerError = vi.fn();
const mockLogger = {
	error: mockLoggerError
} as unknown as Logger;

// Import the unit under test
import { _main } from "./main.js";

// A basic error to test with
const loginError = new Error("Failed to log in. This is a test.");

describe("main", () => {
	beforeEach(() => {
		mockConstructClient.mockReturnValue(undefined);
		mockLogin.mockResolvedValue(mockToken);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("disables @everyone pings", async () => {
		await expect(_main(mockLogger)).resolves.toBeUndefined();
		expect(mockConstructClient).toHaveBeenCalledWith(
			expect.objectContaining({
				allowedMentions: {
					parse: ["roles", "users"],
					repliedUser: true
				}
			})
		);
	});

	test("calls registerEventHandlers", async () => {
		await expect(_main(mockLogger)).resolves.toBeUndefined();
		expect(mockRegisterEventHandlers).toHaveBeenCalledWith(new MockClient());
	});

	test("calls login", async () => {
		await expect(_main(mockLogger)).resolves.toBeUndefined();
		expect(mockLogin).toHaveBeenCalledWith(mockToken);
	});

	test("reports login errors", async () => {
		mockLogin.mockRejectedValueOnce(loginError);
		await expect(_main(mockLogger)).resolves.toBeUndefined();
		expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining("log in"));
	});
});
