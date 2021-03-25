import path from "path";
import { fsUnlink } from "./fsUtils";
import { logOut } from "./discordUtils";

// 45-second timeout for E2E tests
jest.setTimeout(45000);

beforeAll(async () => {
  // Delete the test database
  const dbDir = path.resolve(__dirname, "./db-test/db.sqlite");
  await fsUnlink(dbDir);
});

afterAll(() => {
  logOut();
});
