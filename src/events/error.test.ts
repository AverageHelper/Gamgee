// Mock the logger to track output
import type { Logger } from "../logger.js";
import { describe, expect, test, vi } from "vitest";

const mockLoggerError = vi.fn();
const logger = {
	error: mockLoggerError
} as unknown as Logger;

// Import the unit under test
import { error } from "./error.js";

// A basic error to test with
const mockClientError = new Error("This is a test error");

describe("on(error)", () => {
	test("logs client errors", () => {
		expect(error.execute(mockClientError, logger)).toBeUndefined();
		expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining("client error"));
	});
});
