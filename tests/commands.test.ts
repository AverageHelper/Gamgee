import requireEnv from "./requireEnv";
import { logOut, commandResponseInSameChannel } from "./discordUtils";

const TESTER_ID = requireEnv("CORDE_BOT_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

describe("Command", () => {
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";

  afterAll(() => {
    // Log out of Discord
    logOut();
  });

  describe("sr", () => {
    const needSongLink = `:hammer: <@!${TESTER_ID}>, You're gonna have to add a song link to that.`;

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("sr");
      expect(response?.content).toBe(needSongLink);
    });

    test("returns the queue instructional text", async () => {
      const response = await commandResponseInSameChannel("sr info");
      expect(response?.content).toMatchSnapshot();
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
  });

  describe("video", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const info = `<@${TESTER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;
    const needSongLink = `<@${TESTER_ID}>, You're gonna have to add a song link to that.`;

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("video");
      expect(response?.content).toBe(needSongLink);
    });

    test("returns the title and duration of a song with normal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toBe(info);
    });

    test("returns the title and duration of a song with suboptimal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toBe(info);
    });
  });

  describe("help", () => {
    test("returns the help text", async () => {
      const response = await commandResponseInSameChannel("help");
      expect(response?.content).toMatchSnapshot();
    });
  });
});
