import requireEnv from "./requireEnv";
import path from "path";
import { testerClient, isClientLoggedIn, commandResponseInSameChannel } from "./discordUtils";
import { fsUnlink } from "./fsUtils";

const COMMAND_PREFIX = requireEnv("BOT_PREFIX");
const TESTER_ID = requireEnv("CORDE_BOT_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

async function deleteTestDatabase() {
  const dbDir = path.resolve(__dirname, "./db/db.sqlite");
  await fsUnlink(dbDir);
}

describe("Command", () => {
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";

  beforeAll(async () => {
    await deleteTestDatabase();
  });

  afterAll(async () => {
    // Log out of Discord
    if (isClientLoggedIn) {
      const client = await testerClient();
      client.destroy();
    }
  });

  describe("video", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const info = `<@${TESTER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;

    test("returns the title and duration of a song with normal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toBe(info);
    });

    test("returns the title and duration of a song with suboptimal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toBe(info);
    });
  });

  describe("sr", () => {
    test("returns the queue instructional text", async () => {
      const response = await commandResponseInSameChannel("sr info");
      expect(response?.content).toBe(
        `To submit a song, type \`${COMMAND_PREFIX}sr <link>\`.
For example: \`${COMMAND_PREFIX}sr https://youtu.be/dQw4w9WgXcQ\`
I will respond with a text verification indicating your song has joined the queue!`
      );
    });

    test("yells at the tester for trying to set up a queue", async () => {
      let response = await commandResponseInSameChannel("sr setup");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);

      response = await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to open a queue", async () => {
      const response = await commandResponseInSameChannel("sr open");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to close the queue", async () => {
      const response = await commandResponseInSameChannel("sr close");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to set limits on the queue", async () => {
      const response = await commandResponseInSameChannel("sr limit");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to see queue statistics", async () => {
      const response = await commandResponseInSameChannel("sr stats");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to restart the queue", async () => {
      const response = await commandResponseInSameChannel("sr restart");
      expect(response?.content).toBe(PERMISSION_ERROR_RESPONSE);
    });

    // TODO: Add a test for sr <song link>
  });

  describe("help", () => {
    test("returns the help text", async () => {
      const response = await commandResponseInSameChannel("help");
      expect(response?.content).toMatchSnapshot();
    });
  });
});
