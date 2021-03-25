import path from "path";
import { fsUnlink } from "./fsUtils";
import { logOut } from "./discordUtils";

// 30-second timeout for E2E tests
jest.setTimeout(30000);

beforeAll(async () => {
  // Delete the test database
  const dbDir = path.resolve(__dirname, "./db-test/db.sqlite");
  await fsUnlink(dbDir);
});

afterAll(() => {
  logOut();
});
