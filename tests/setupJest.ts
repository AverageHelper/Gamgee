import { logOut } from "./discordUtils";
import { useTestLogger } from "./testUtils/logger";

const logger = useTestLogger(/* "info" */);
logger.info(`Node ${process.version}`);

// 45-second timeout for E2E tests
jest.setTimeout(45000);

afterAll(() => {
	logOut();
});
