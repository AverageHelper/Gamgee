import { afterAll, beforeAll } from "vitest";
import { destroyTesterClient, setupTesterClient } from "./discordUtils/testerClient.js";

beforeAll(async () => {
	// Signs in the test client before any tests run
	await setupTesterClient();
});

afterAll(async () => {
	// Signs out the test client after all tests are done
	await destroyTesterClient();
});
