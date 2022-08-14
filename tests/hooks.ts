import { destroyTesterClient, setupTesterClient } from "./discordUtils/testerClient"; // use .js in ESM

export const mochaHooks = {
	async before(): Promise<void> {
		// Signs in the test client before any tests run
		await setupTesterClient();
	},
	after(): void {
		// Signs out the test client after all tests are done
		destroyTesterClient();
	}
};
