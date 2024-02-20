import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Create a test logger
import { useTestLogger } from "../../tests/testUtils/logger.js";
const logger = useTestLogger();

const MockClient = vi.hoisted(
	() =>
		class MockClient {
			user = {
				username: "Gamgee"
			};

			destroy(): void {
				// nop
			}
		}
);

vi.mock("discord.js", async () => ({
	...(await vi.importActual<typeof import("discord.js")>("discord.js")),
	Client: MockClient
}));

import { Client } from "discord.js";
const client = new Client({ intents: [] });

// Mock parseArgs so we can control what the args are
import type { Args } from "../helpers/parseArgs.js";
const mockParseArgs = vi.hoisted(() => vi.fn<[], Args>());
vi.mock("../helpers/parseArgs.js", () => ({ parseArgs: mockParseArgs }));

// Mock deployCommands so we can track it
vi.mock("../actions/deployCommands.js");
import { deployCommands } from "../actions/deployCommands.js";
const mockDeployCommands = deployCommands as Mock<
	Parameters<typeof deployCommands>,
	ReturnType<typeof deployCommands>
>;

// Mock revokeCommands so we can track it
vi.mock("../actions/revokeCommands.js");
import { revokeCommands } from "../actions/revokeCommands.js";
const mockRevokeCommands = revokeCommands as Mock<
	Parameters<typeof revokeCommands>,
	ReturnType<typeof revokeCommands>
>;

// Mock verifyCommandDeployments so we can track it
vi.mock("../actions/verifyCommandDeployments.js");
import { verifyCommandDeployments } from "../actions/verifyCommandDeployments.js";
const mockVerifyCommandDeployments = verifyCommandDeployments as Mock<
	Parameters<typeof verifyCommandDeployments>,
	ReturnType<typeof verifyCommandDeployments>
>;

// TODO: Mock the logger so nothing is printed

// Import the unit under test
import { ready } from "./ready.js";

describe("once(ready)", () => {
	beforeEach(() => {
		// Default is no deploy, no revoke, no method behavior
		mockParseArgs.mockReturnValue({
			deploy: false,
			revoke: false
		});
		mockDeployCommands.mockResolvedValue(undefined);
		mockRevokeCommands.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("doesn't touch commands if the `deploy` and `revoke` flags are not set", async () => {
		mockParseArgs.mockReturnValue({
			deploy: false,
			revoke: false
		});
		await expect(ready.execute(client, logger)).resolves.toBeUndefined();
		expect(mockDeployCommands).not.toHaveBeenCalled();
		expect(mockRevokeCommands).not.toHaveBeenCalled();
	});

	test("deploys commands if the `deploy` flag is set", async () => {
		mockParseArgs.mockReturnValue({
			deploy: true,
			revoke: false
		});
		await expect(ready.execute(client, logger)).resolves.toBeUndefined();
		expect(mockDeployCommands).toHaveBeenCalledWith(client, logger);
		expect(mockRevokeCommands).not.toHaveBeenCalled();
	});

	test("revokes commands if the `revoke` flag is set", async () => {
		mockParseArgs.mockReturnValue({
			deploy: false,
			revoke: true
		});
		await expect(ready.execute(client, logger)).resolves.toBeUndefined();
		expect(mockDeployCommands).not.toHaveBeenCalled();
		expect(mockRevokeCommands).toHaveBeenCalledWith(client, logger);
	});

	test("deploys commands if both the `revoke` and `deploy` flags are set", async () => {
		mockParseArgs.mockReturnValue({
			deploy: true,
			revoke: true
		});
		await expect(ready.execute(client, logger)).resolves.toBeUndefined();
		expect(mockDeployCommands).toHaveBeenCalledWith(client, logger);
		expect(mockRevokeCommands).not.toHaveBeenCalled();
	});

	test("verifies command deployments", async () => {
		await expect(ready.execute(client, logger)).resolves.toBeUndefined();
		expect(mockVerifyCommandDeployments).toHaveBeenCalledWith(client, logger);
	});
});
