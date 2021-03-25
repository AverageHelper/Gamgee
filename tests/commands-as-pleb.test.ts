import { requireEnv } from "../src/helpers/environment";
import {
  setIsQueueAdmin,
  setIsQueueCreator,
  commandResponseInSameChannel,
  sendMessage
} from "./discordUtils";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

describe("Command as pleb", () => {
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";

  beforeEach(async () => {
    await sendMessage(`**Preparing to test '${expect.getState().currentTestName}'**`);
    // Remove the Queue Admin role from the tester bot
    await setIsQueueAdmin(false);
    await setIsQueueCreator(false);
  });

  describe("sr", () => {
    const needSongLink = `You're gonna have to add a song link to that.`;

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("sr");
      expect(response?.content).toContain(needSongLink);
    });

    test("returns the queue instructional text", async () => {
      const response = await commandResponseInSameChannel("sr info");
      expect(response?.content).toMatchSnapshot();
    });

    test("yells at the tester for trying to set up a queue", async () => {
      let response = await commandResponseInSameChannel("sr setup");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);

      response = await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to open the queue", async () => {
      const response = await commandResponseInSameChannel("sr open");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to close the queue", async () => {
      const response = await commandResponseInSameChannel("sr close");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to set limits on the queue", async () => {
      const response = await commandResponseInSameChannel("sr limit count");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });

    test("allows the tester to get the queue's global limits", async () => {
      const response = await commandResponseInSameChannel("sr limit");
      expect(response?.content).toMatchSnapshot();
    });

    test("yells at the tester for trying to see queue statistics", async () => {
      const response = await commandResponseInSameChannel("sr stats");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });

    test("yells at the tester for trying to restart the queue", async () => {
      const response = await commandResponseInSameChannel("sr restart");
      expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
    });
  });

  describe("video", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const info = `Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 32 seconds)`;
    const needSongLink = `You're gonna have to add a song link to that.`;

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("video");
      expect(response?.content).toContain(needSongLink);
    });

    test("returns the title and duration of a song with normal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toContain(info);
    });

    test("returns the title and duration of a song with suboptimal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`);
      expect(response?.content).toContain(info);
    });
  });

  describe("help", () => {
    test("returns the help text", async () => {
      const response = await commandResponseInSameChannel("help");
      expect(response?.content).toMatchSnapshot();
    });
  });
});
