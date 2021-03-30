import { requireEnv } from "../src/helpers/environment";
import {
  setIsQueueAdmin,
  setIsQueueCreator,
  commandResponseInSameChannel,
  sendMessage
} from "./discordUtils";

const TESTER_ID = requireEnv("CORDE_BOT_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

describe("Command as pleb", () => {
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";
  const url = "https://youtu.be/dQw4w9WgXcQ";

  beforeEach(async () => {
    await sendMessage(`**'${expect.getState().currentTestName}'**`);

    await setIsQueueCreator(true);
    await commandResponseInSameChannel("sr teardown");

    // Remove the Queue Admin role from the tester bot
    await setIsQueueAdmin(false);
    await setIsQueueCreator(false);
  });

  describe("unknown input", () => {
    test("does nothing", async () => {
      const response = await commandResponseInSameChannel("dunno what this does");
      expect(response).toBeNull();
    });
  });

  describe("sr", () => {
    const needSongLink = `You're gonna have to add a song link to that.`;

    describe("when the queue is not set up", () => {
      test.each`
        subcommand
        ${"stats"}
        ${"setup"}
        ${"restart"}
        ${"open"}
        ${"close"}
      `(
        "$subcommand yells at the user because they don't have permission",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(`sr ${subcommand}`);
          expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
        }
      );

      test("url request does nothing", async () => {
        const response = await commandResponseInSameChannel(`sr ${url}`);
        expect(response?.content.toLowerCase()).toContain("no queue");
      });
    });

    describe.each`
      isOpen   | state
      ${true}  | ${"open"}
      ${false} | ${"closed"}
    `("when the queue is $state", ({ isOpen }: { isOpen: boolean }) => {
      beforeEach(async () => {
        await sendMessage(`**Setup**`);
        await setIsQueueCreator(true);
        await setIsQueueAdmin(true);
        await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);

        if (isOpen) {
          await commandResponseInSameChannel("sr open");
        } else {
          await commandResponseInSameChannel("sr close");
        }

        await setIsQueueCreator(false);
        await setIsQueueAdmin(false);
        await sendMessage(`**Run**`);
      });

      if (isOpen) {
        test("accepts a song request", async () => {
          const response = await commandResponseInSameChannel(`sr ${url}`);
          // Check that the request appears in the queue as well
          expect(response?.content).toBe(`<@!${TESTER_ID}>, Submission Accepted!`);
        });
      } else {
        test("url request tells the user the queue is not open", async () => {
          const response = await commandResponseInSameChannel(`sr ${url}`);
          expect(response?.content).toContain("queue is not open");
        });
      }

      test("asks for a song link", async () => {
        const response = await commandResponseInSameChannel("sr");
        expect(response?.content).toContain(needSongLink);
      });

      test("setup yells at the tester for trying to set up a queue", async () => {
        let response = await commandResponseInSameChannel("sr setup");
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);

        response = await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
      });

      test("limit allows the tester to get the queue's global limits", async () => {
        const response = await commandResponseInSameChannel("sr limit");
        expect(response?.content).toMatchSnapshot();
      });

      test.each`
        subcommand
        ${"open"}
        ${"close"}
        ${"limit count"}
        ${"stats"}
        ${"restart"}
      `(
        "$subcommand yells at the tester because they don't have permission",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(`sr ${subcommand}`);
          expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
        }
      );
    });
  });

  describe("video", () => {
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
      const response = await commandResponseInSameChannel(`video             ${url}`);
      expect(response?.content).toContain(info);
    });
  });
});
