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
const RUN_CHANNEL_ID = requireEnv("CHANNEL_ID");
const QUEUE_CHANNEL_ID = requireEnv("QUEUE_CHANNEL_ID");

const QUEUE_COMMAND = "queue";

describe("Command as admin", () => {
  const url = "https://youtu.be/dQw4w9WgXcQ";
  const PERMISSION_ERROR_RESPONSE = "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that...";
  const NO_QUEUE = "no queue";

  beforeEach(async () => {
    await sendMessage(`**'${expect.getState().currentTestName}'**`);

    await setIsQueueCreator(true);
    await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`);

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

  describe("queue", () => {
    describe("when the queue is not set up", () => {
      const NO_QUEUE = "no queue";

      test.each`
        subcommand
        ${"stats"}
        ${"open"}
        ${"close"}
      `(
        "$subcommand asks the user to set up the queue",
        async ({ subcommand }: { subcommand: string }) => {
          const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} ${subcommand}`);
          expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
        }
      );

      test("url request does nothing", async () => {
        const response = await commandResponseInSameChannel(`sr ${url}`);
        expect(response?.content.toLowerCase()).toContain("no queue");
      });
    });

    describe("no queue yet", () => {
      beforeEach(async () => {
        await sendMessage(`**Setup**`);
        await setIsQueueCreator(true);
        await setIsQueueAdmin(true);

        await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} restart`);
        await waitForMessage(
          msg =>
            msg.author.id === UUT_ID &&
            msg.channel.id === RUN_CHANNEL_ID &&
            msg.content.includes("has restarted")
        );
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit count null`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit cooldown null`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit entry-duration null`);

        await setIsQueueCreator(false);
        await sendMessage(`**Run**`);
      });

      test("fails to set up a queue without a channel mention", async () => {
        await setIsQueueCreator(true);
        const cmdMessage = await sendCommand(`${QUEUE_COMMAND} setup`);
        const response = await waitForMessage(
          msg => msg.author.id === UUT_ID && msg.channel.id === cmdMessage.channel.id
        );
        expect(cmdMessage.deleted).toBeTrue();
        expect(response?.content).toContain("name a text channel");
      });

      test("fails to set up a queue with an improper channel mention", async () => {
        await setIsQueueCreator(true);
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} setup queue`);
        expect(response?.content).toContain("That's not a real channel");
      });

      test("fails to set up a queue without owner permission", async () => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} setup queue`);
        expect(response?.content).toContain(PERMISSION_ERROR_RESPONSE);
      });

      test.each`
        key
        ${"entry-duration"}
        ${"cooldown"}
        ${"count"}
      `("fails to set $key limits on the queue", async ({ key }: { key: string }) => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} limit ${key} 3`);
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to get the queue's global limits", async () => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} limit`);
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
          const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} limit ${key}`);
          expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
        }
      );

      test("fails to open the queue", async () => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} open`);
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to close the queue", async () => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      test("fails to see queue statistics", async () => {
        const response = await commandResponseInSameChannel(`${QUEUE_COMMAND} stats`);
        expect(response?.content.toLowerCase()).toContain(NO_QUEUE);
      });

      // FIXME: This needs to run last b/c it only works once per server. Set up a teardown command.
      test("allows the tester to set up a queue", async () => {
        await setIsQueueCreator(true);
        await sendCommand(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);
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

        await commandResponseInSameChannel(`${QUEUE_COMMAND} teardown`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} restart`);
        await waitForMessage(
          msg =>
            msg.author.id === UUT_ID &&
            msg.channel.id === RUN_CHANNEL_ID &&
            msg.content.includes("has restarted")
        );
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit count null`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit cooldown null`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} limit entry-duration null`);
        await commandResponseInSameChannel(`${QUEUE_COMMAND} setup <#${QUEUE_CHANNEL_ID}>`);

        await setIsQueueCreator(false);
        await sendMessage(`**Run**`);
      });

      describe("queue open", () => {
        beforeEach(async () => {
          await commandResponseInSameChannel(`${QUEUE_COMMAND} open`);
        });

        test("fails to open the queue", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} open`,
            undefined,
            "already open"
          );
          expect(response?.content).toContain("already open");
        });

        test("allows the tester to close the queue", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} close`,
            undefined,
            "now closed"
          );
          expect(response?.content).not.toContain("already");
          expect(response?.content).toContain("now closed");
        });

        test("allows the tester to see queue statistics", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} stats`,
            undefined,
            "Queue channel"
          );
          expect(response?.content).toContain(
            `Queue channel: <#${QUEUE_CHANNEL_ID}>\nNothing has been added yet.`
          );
        });

        // TODO: Add tests for setting queue limits
      });

      describe("queue closed", () => {
        beforeEach(async () => {
          await commandResponseInSameChannel(`${QUEUE_COMMAND} close`);
        });

        test("allows the tester to open the queue", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} open`,
            undefined,
            "now open"
          );
          expect(response?.content).not.toContain("already");
          expect(response?.content).toContain("now open");
        });

        test("fails to close the queue", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} close`,
            undefined,
            "already closed"
          );
          expect(response?.content).toContain("already closed");
        });

        test("allows the tester to see queue statistics", async () => {
          const response = await commandResponseInSameChannel(
            `${QUEUE_COMMAND} stats`,
            undefined,
            "Queue channel"
          );
          expect(response?.content).toContain(
            `Queue channel: <#${QUEUE_CHANNEL_ID}>\nNothing has been added yet.`
          );
        });

        // TODO: Add tests for setting queue limits
      });
    });
  });

  describe("video", () => {
    const info = `Rick Astley - Never Gonna Give You Up (Video): (3 minutes, 33 seconds)`;
    const needSongLink = `You're gonna have to add a song link to that.`;

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
