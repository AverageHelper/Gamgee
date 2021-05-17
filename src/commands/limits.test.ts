jest.mock("../actions/queue/getQueueChannel");
jest.mock("../actions/queue/useQueue");

import getQueueChannel from "../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueue } from "../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import type { GuildedCommandContext } from "./CommandContext";
import durationString from "../helpers/durationString";
import limits from "./limits";

const mockReply = jest.fn().mockResolvedValue(undefined);

const mockGetConfig = jest.fn();

describe("Get Queue Limits", () => {
  let context: GuildedCommandContext;

  beforeEach(() => {
    context = ({
      guild: "the-guild",
      reply: mockReply
    } as unknown) as GuildedCommandContext;

    mockGetQueueChannel.mockResolvedValue({
      id: "queue-channel"
    });
    mockUseQueue.mockReturnValue({
      getConfig: mockGetConfig
    });
    mockGetConfig.mockResolvedValue({
      cooldownSeconds: null,
      entryDurationSeconds: null,
      submissionMaxQuantity: null
    });
  });

  test("cannot show statistics on a queue that does not exist", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    await expect(limits.execute(context)).resolves.toBeUndefined();
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test.each`
    cooldownSeconds | entryDurationSeconds | submissionMaxQuantity
    ${null}         | ${null}              | ${null}
    ${42}           | ${null}              | ${null}
    ${null}         | ${42}                | ${null}
    ${null}         | ${null}              | ${42}
    ${42}           | ${42}                | ${null}
    ${null}         | ${42}                | ${42}
    ${42}           | ${null}              | ${42}
    ${42}           | ${42}                | ${42}
  `(
    "shows statistics on queue limits",
    async ({
      cooldownSeconds,
      entryDurationSeconds,
      submissionMaxQuantity
    }: {
      cooldownSeconds: number | null;
      entryDurationSeconds: number | null;
      submissionMaxQuantity: number | null;
    }) => {
      mockGetConfig.mockResolvedValue({
        cooldownSeconds,
        entryDurationSeconds,
        submissionMaxQuantity
      });
      await expect(limits.execute(context)).resolves.toBeUndefined();
      expect(mockUseQueue).toHaveBeenCalledTimes(1);
      expect(mockUseQueue).toHaveBeenCalledWith({ id: "queue-channel" });
      expect(mockReply).toHaveBeenCalledTimes(1);

      const entryDurationDesc =
        entryDurationSeconds !== null ? durationString(entryDurationSeconds) : "infinite";
      expect(mockReply).toHaveBeenCalledWith(
        expect.stringContaining(`\`entry-duration\` - **${entryDurationDesc}**`)
      );

      const cooldownDesc = cooldownSeconds !== null ? durationString(cooldownSeconds) : "none";
      expect(mockReply).toHaveBeenCalledWith(
        expect.stringContaining(`\`cooldown\` - **${cooldownDesc}**`)
      );

      const countDesc = submissionMaxQuantity ?? "infinite";
      expect(mockReply).toHaveBeenCalledWith(
        expect.stringContaining(`\`count\` - **${countDesc}**`)
      );
    }
  );
});
