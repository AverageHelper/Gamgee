import path from "path";
import { fsUnlink } from "./fsUtils";

// 30-second timeout for E2E tests
jest.setTimeout(30000);

async function deleteTestDatabase() {
  const dbDir = path.resolve(__dirname, "./db/db.sqlite");
  await fsUnlink(dbDir);
}

beforeAll(async () => {
  await deleteTestDatabase();
});
