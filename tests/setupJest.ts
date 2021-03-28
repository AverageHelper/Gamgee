import { logOut } from "./discordUtils";

// 45-second timeout for E2E tests
jest.setTimeout(45000);

afterAll(() => {
  logOut();
});
