import { logOut } from "./discordUtils/index.js";
import { useTestLogger } from "./testUtils/logger.js";

const logger = useTestLogger(/* "info" */);
logger.info(`Node ${process.version}`);

// 45-second timeout for E2E tests
jest.setTimeout(45000);

afterAll(async () => {
	await logOut();
});
