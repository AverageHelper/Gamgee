import { requireEnv } from "../src/helpers/environment";
import {
  setIsQueueAdmin,
  setIsQueueCreator,
  commandResponseInSameChannel,
  sendCommand,
  waitForMessage,
  sendMessage
} from "./discordUtils";

const UUT_ID = requireEnv("BOT_TEST_ID");
const TESTER_ID = requireEnv("CORDE_BOT_ID");
const RUN_CHANNEL_ID = requireEnv("CHANNEL_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

describe("Command as admin", () => {
  const url = "https://youtu.be/dQw4w9WgXcQ";
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";
  const NO_QUEUE = "no queue";

  beforeEach(async () => {
    await sendMessage(`**'${expect.getState().currentTestName}'**`);

    await setIsQueueCreator(true);
    await commandResponseInSameChannel("sr teardown");

    // Add the Queue Admin role to the tester bot
    await setIsQueueCreator(false);
    await setIsQueueAdmin(true);
  });

  describe("unknown input", () => {
    test("does nothing", async () => {
      const response = await commandResponseInSameChannel("dunno what this does");
      expect(response).toBeNull();
    });
  });

  describe("sr", () => {
    const needSongLink = `:hammer: <@!${TESTER_ID}>, You're gonna have to add a song link to that.`;

    describe("when the queue is not set up", () => {
      const NO_QUEUE = "no queue";

      test.each`
        subcommand
        ${"stats"}
        ${"restart"}
        ${"open"}
        ${"close"}
      `(
        "$subcommand asks the user to set up the queue",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(`sr ${subcommand}`);
          expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
        }
      );

      test("url request does nothing", async () => {
        const response = await commandResponseInSameChannel(`sr ${url}`);
        expect(response?.content.toLowerCase()).toContain("no queue");
      });
    });

    test("asks for a song link", async () => {
      const response = await commandResponseInSameChannel("sr");
      expect(response?.content).toBe(needSongLink);
    });

    describe("no queue yet", () => {
      beforeEach(async () => {
        await sendMessage(`**Setup**`);
        await setIsQueueCreator(true);
        await setIsQueueAdmin(true);

        await commandResponseInSameChannel("sr teardown");
        await commandResponseInSameChannel("sr close");
        await commandResponseInSameChannel("sr restart");
        await waitForMessage(
          msg =>
            msg.author.id === UUT_ID &&
            msg.channel.id === RUN_CHANNEL_ID &&
            msg.content.includes("has restarted")
        );
        await commandResponseInSameChannel("sr limit count null");
        await commandResponseInSameChannel("sr limit cooldown null");
        await commandResponseInSameChannel("sr limit entry-duration null");

        await setIsQueueCreator(false);
        await sendMessage(`**Run**`);
      });

      test("fails to set up a queue without a channel mention", async () => {
        await setIsQueueCreator(true);
        const cmdMessage = await sendCommand("sr setup");
        const response = await waitForMessage(
          msg => msg.author.id === UUT_ID && msg.channel.id === cmdMessage.channel.id
        );
        expect(cmdMessage.deleted).toBeTrue();
        expect(response?.content).toContain("name a text channel");
      });

      test("fails to set up a queue with an improper channel mention", async () => {
        await setIsQueueCreator(true);
        const response = await commandResponseInSameChannel("sr setup queue");
        expect(response?.content).toContain("That's not a real channel");
      });

      test("fails to set up a queue without owner permission", async () => {
        const response = await commandResponseInSameChannel("sr setup queue");
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
      });

      test.each`
        key
        ${"entry-duration"}
        ${"cooldown"}
        ${"count"}
      `("fails to set $key limits on the queue", async ({ key }: { key: string }) => {
        const response = await commandResponseInSameChannel(`sr limit ${key} 3`);
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to get the queue's global limits", async () => {
        const response = await commandResponseInSameChannel("sr limit");
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test.each`
        key
        ${"entry-duration"}
        ${"cooldown"}
        ${"count"}
      `(
        "allows the tester to get the queue's global $key limit",
        async ({ key }: { key: string }) => {
          const response = await commandResponseInSameChannel(`sr limit ${key}`);
          expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
        }
      );

      test("fails to open the queue", async () => {
        const response = await commandResponseInSameChannel("sr open");
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to close the queue", async () => {
        const response = await commandResponseInSameChannel("sr close");
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to see queue statistics", async () => {
        const response = await commandResponseInSameChannel("sr stats");
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to restart the queue", async () => {
        const response = await commandResponseInSameChannel("sr restart");
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      // FIXME: This needs to run last b/c it only works once per server. Set up a teardown command.
      test("allows the tester to set up a queue", async () => {
        await setIsQueueCreator(true);
        await sendCommand(`sr setup <#${QUEUE_CHANNEL_ID}>`);
        const response = await waitForMessage(
          msg => msg.author.id === UUT_ID && msg.channel.id === QUEUE_CHANNEL_ID
        );
        expect(response?.content).toContain("This is a queue now.");
      });
    });

    describe("queue available", () => {
      beforeEach(async () => {
        await sendMessage(`**Setup**`);
        await setIsQueueCreator(true);
        await setIsQueueAdmin(true);

        await commandResponseInSameChannel("sr teardown");
        await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);
        await commandResponseInSameChannel("sr close");
        await commandResponseInSameChannel("sr restart");
        await waitForMessage(
          msg =>
            msg.author.id === UUT_ID &&
            msg.channel.id === RUN_CHANNEL_ID &&
            msg.content.includes("has restarted")
        );
        await commandResponseInSameChannel("sr limit count null");
        await commandResponseInSameChannel("sr limit cooldown null");
        await commandResponseInSameChannel("sr limit entry-duration null");
        await commandResponseInSameChannel(`sr setup <#${QUEUE_CHANNEL_ID}>`);

        await setIsQueueCreator(false);
        await sendMessage(`**Run**`);
      });

      describe("queue open", () => {
        beforeEach(async () => {
          await commandResponseInSameChannel("sr open");
        });

        test("fails to open the queue", async () => {
          const response = await commandResponseInSameChannel("sr open", undefined, "already open");
          expect(response?.content).toContain("already open");
        });

        test("allows the tester to close the queue", async () => {
          const response = await commandResponseInSameChannel("sr close", undefined, "now closed");
          expect(response?.content).not.toContain("already");
          expect(response?.content).toContain("now closed");
        });

        test("allows the tester to see queue statistics", async () => {
          const response = await commandResponseInSameChannel(
            "sr stats",
            undefined,
            "Queue channel"
          );
          expect(response?.content).toContain(
            `Queue channel: <#${QUEUE_CHANNEL_ID}>\nNothing has been added yet.`
          );
        });

        test("allows the tester to restart the queue", async () => {
          const startResponse = await commandResponseInSameChannel(
            "sr restart",
            undefined,
            "Clearing the queue"
          );
          const finishResponse = await waitForMessage(
            msg =>
              msg.author.id === UUT_ID &&
              msg.channel.id === RUN_CHANNEL_ID &&
              msg.id !== startResponse?.id &&
              msg.content.toLowerCase().includes("the queue has restarted")
          );
          expect(startResponse?.deleted).toBeFalse();
          expect(startResponse?.content).toContain("Clearing the queue");
          expect(finishResponse?.content).toContain("The queue has restarted");
        });

        // TODO: Add tests for setting queue limits
      });

      describe("queue closed", () => {
        beforeEach(async () => {
          await commandResponseInSameChannel("sr close");
        });

        test("allows the tester to open the queue", async () => {
          const response = await commandResponseInSameChannel("sr open", undefined, "now open");
          expect(response?.content).not.toContain("already");
          expect(response?.content).toContain("now open");
        });

        test("fails to close the queue", async () => {
          const response = await commandResponseInSameChannel(
            "sr close",
            undefined,
            "already closed"
          );
          expect(response?.content).toContain("already closed");
        });

        test("allows the tester to see queue statistics", async () => {
          const response = await commandResponseInSameChannel(
            "sr stats",
            undefined,
            "Queue channel"
          );
          expect(response?.content).toContain(
            `Queue channel: <#${QUEUE_CHANNEL_ID}>\nNothing has been added yet.`
          );
        });

        test("allows the tester to restart the queue", async () => {
          const startResponse = await commandResponseInSameChannel(
            "sr restart",
            undefined,
            "Clearing the queue"
          );
          const finishResponse = await waitForMessage(
            msg =>
              msg.author.id === UUT_ID &&
              msg.channel.id === RUN_CHANNEL_ID &&
              msg.id !== startResponse?.id &&
              msg.content.toLowerCase().includes("the queue has restarted")
          );
          expect(startResponse?.deleted).toBeFalse();
          expect(startResponse?.content).toContain("Clearing the queue");
          expect(finishResponse?.content).toContain("The queue has restarted");
        });

        // TODO: Add tests for setting queue limits
      });
    });
  });

  describe("video", () => {
    const info = `<@${TESTER_ID}>, Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 33 seconds)`;
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
      const response = await commandResponseInSameChannel(`video             ${url}`);
      expect(response?.content).toBe(info);
    });
  });
});
