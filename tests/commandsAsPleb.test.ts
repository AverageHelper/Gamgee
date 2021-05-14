import { requireEnv } from "../src/helpers/environment";
import {
  setIsQueueAdmin,
  setIsQueueCreator,
  commandResponseInSameChannel,
  sendMessage,
  waitForMessage
} from "./discordUtils";

const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");
const TEST_CHANNEL_ID = requireEnv("CHANNEL_ID");
const UUT_ID = requireEnv("BOT_TEST_ID");

const QUEUE_COMMAND = "queue";

describe("Command as pleb", () => {
  const PERMISSION_ERROR_RESPONSE = "You don't have permission to run that command.";
  const THINKING_RESPONSE = "Let me think...";
  const url = "https://youtu.be/dQw4w9WgXcQ";

  beforeEach(async () => {
    await sendMessage(`**'${expect.getState().currentTestName}'**`);

    await setIsQueueCreator(true);
    await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`, undefined, "deleted");

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

  describe("limits", () => {
    beforeEach(async () => {
      await sendMessage(`**Setup**`);
      await setIsQueueCreator(true);
      await setIsQueueAdmin(true);
      await commandResponseInSameChannel(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);

      await setIsQueueCreator(false);
      await setIsQueueAdmin(false);
      await sendMessage(`**Run**`);
    });

    test("allows the tester to get the queue's global limits", async () => {
      const response = await commandResponseInSameChannel("limits");
      expect(response?.content).toMatchSnapshot();
    });
  });

  describe("queue", () => {
    describe("when the queue is not set up", () => {
      test.each`
        subcommand
        ${"stats"}
        ${"setup"}
        ${"open"}
        ${"close"}
      `(
        "$subcommand yells at the user because they don't have permission",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} ${subcommand}`,
            undefined,
            PERMISSION_ERROR_RESPONSE
          );
          expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
        }
      );

      test("url request does nothing", async () => {
        const response = await commandResponseInSameChannel(`sr ${url}`, undefined, "no queue");
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
        await commandResponseInSameChannel(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);

        if (isOpen) {
          await commandResponseInSameChannel(`${QUEUE_COMMAND} open`);
        } else {
          await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
        }

        await setIsQueueCreator(false);
        await setIsQueueAdmin(false);
        await sendMessage(`**Run**`);
      });

      if (isOpen) {
        test("accepts a song request", async () => {
          const waitingResponse = await commandResponseInSameChannel(`sr ${url}`);
          expect(waitingResponse?.content).toBe(THINKING_RESPONSE);

          // TODO: Check that the request appears in the queue as well
          const finishedResponse = await waitForMessage(
            msg =>
              msg.author.id === UUT_ID &&
              msg.channel.id === TEST_CHANNEL_ID &&
              msg.createdTimestamp > (waitingResponse?.createdTimestamp ?? 0) &&
              msg.content === "Submission Accepted!"
          );
          expect(finishedResponse?.content).toBe(`Submission Accepted!`);
        });

        test("`sr` alone provides info on how to use the request command", async () => {
          const response = await commandResponseInSameChannel(
            "sr",
            undefined,
            "To submit a song, type"
          );
          expect(response?.content).toContain("To submit a song, type");
        });
      } else {
        test("url request tells the user the queue is not open", async () => {
          const response = await commandResponseInSameChannel(
            `sr ${url}`,
            undefined,
            "queue is not open"
          );
          expect(response?.content).toContain("queue is not open");
        });
      }

      test("setup yells at the tester for trying to set up a queue", async () => {
        let response = await commandResponseInSameChannel(
          `${QUEUE_COMMAND} setup`,
          undefined,
          PERMISSION_ERROR_RESPONSE
        );
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);

        response = await commandResponseInSameChannel(
          `${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`,
          undefined,
          PERMISSION_ERROR_RESPONSE
        );
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
      });

      test.each`
        subcommand
        ${"open"}
        ${"close"}
        ${"limit count"}
        ${"stats"}
      `(
        "$subcommand yells at the tester because they don't have permission",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} ${subcommand}`,
            undefined,
            PERMISSION_ERROR_RESPONSE
          );
          expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
        }
      );
    });
  });

  describe("video", () => {
    const info = `Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 33 seconds)`;
    const needSongLink = `You're gonna have to add a song link to that.`;

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("video", undefined, needSongLink);
      expect(response?.content).toContain(needSongLink);
    });

    test("returns the title and duration of a song with normal spacing", async () => {
      const response = await commandResponseInSameChannel(`video ${url}`, undefined, info);
      expect(response?.content).toContain(info);
    });

    test("returns the title and duration of a song with suboptimal spacing", async () => {
      const response = await commandResponseInSameChannel(
        `video             ${url}`,
        undefined,
        info
      );
      expect(response?.content).toContain(info);
    });
  });
});
