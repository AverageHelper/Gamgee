jest.mock("./actions");
jest.mock("../../actions/messages");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../actions/userIsQueueAdmin");

import * as messageActions from "./actions";
const mockReply = messageActions.reply as jest.Mock;

import { bulkDeleteMessagesWithIds, replyPrivately } from "../../actions/messages";
const mockReplyPrivately = replyPrivately as jest.Mock;
const mockBulkDeleteMessagesWithIds = bulkDeleteMessagesWithIds as jest.Mock;

import { useQueue } from "../../actions/queue/useQueue";
const mockUseQueue = useQueue as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import userIsQueueAdmin from "../../actions/userIsQueueAdmin";
const mockUserIsQueueAdmin = userIsQueueAdmin as jest.Mock;

const mockGetAllEntries = jest.fn();
const mockQueueClear = jest.fn();
const mockStartTyping = jest.fn();

import restart from "./restart";
import { useTestLogger } from "../../../tests/testUtils/logger";
import type { CommandContext } from "../Command";

const logger = useTestLogger("error");

describe("Clear queue contents", () => {
  beforeEach(() => {
    mockUseQueue.mockReturnValue({
      getAllEntries: mockGetAllEntries,
      clear: mockQueueClear
    });
    mockGetAllEntries.mockResolvedValue([]);
    mockQueueClear.mockResolvedValue(undefined);
    mockReplyPrivately.mockResolvedValue(undefined);
    mockUserIsQueueAdmin.mockResolvedValue(false);
  });

  test("does nothing about a message with no guild", async () => {
    const context = {
      logger,
      message: "reply to me"
    };

    await expect(restart.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(context.message, "Can't do that here.");
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when admin and no queue is set up", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    mockUserIsQueueAdmin.mockResolvedValue(true);
    const context = {
      logger,
      message: {
        guild: "the guild",
        channel: {
          id: "not-queue-channel"
        }
      }
    };

    await expect(restart.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReplyPrivately).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(
      context.message,
      "No queue is set up. Maybe that's what you wanted...?"
    );
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when not admin and no queue is set up", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    mockUserIsQueueAdmin.mockResolvedValue(false);
    const context = {
      logger,
      message: {
        guild: "the guild",
        channel: {
          id: "not-queue-channel"
        }
      }
    };

    await expect(restart.execute((context as unknown) as CommandContext)).toResolve();

    // Non-admins outside the queue channel get a permission error
    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      context.message,
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test("does nothing when not admin and not in queue channel", async () => {
    mockGetQueueChannel.mockResolvedValue({ id: "queue-channel" });
    mockUserIsQueueAdmin.mockResolvedValue(false);
    const context = {
      logger,
      message: {
        guild: "the guild",
        channel: {
          id: "not-queue-channel"
        }
      }
    };

    await expect(restart.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      context.message,
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockUseQueue).not.toHaveBeenCalled();
  });

  test.each`
    channelId              | isAdmin
    ${"not-queue-channel"} | ${true}
    ${"queue-channel"}     | ${true}
    ${"queue-channel"}     | ${false}
  `(
    "clears the queue when admin==$isAdmin and in $channelId",
    async ({ channelId, isAdmin }: { channelId: string; isAdmin: boolean }) => {
      const queueChannel = { id: "queue-channel" };
      const queueEntries = [
        { queueMessageId: "message1" },
        { queueMessageId: "message2" },
        { queueMessageId: "message3" }
      ];
      mockGetQueueChannel.mockResolvedValue(queueChannel);
      mockUserIsQueueAdmin.mockResolvedValue(isAdmin);
      mockGetAllEntries.mockResolvedValue(queueEntries);
      const context = {
        logger,
        message: {
          guild: "the guild",
          channel: {
            id: channelId,
            startTyping: mockStartTyping
          }
        }
      };

      await expect(restart.execute((context as unknown) as CommandContext)).toResolve();

      // Feedback
      expect(mockStartTyping).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledTimes(2);
      expect(mockReply).toHaveBeenNthCalledWith(
        1,
        context.message,
        "Time for a reset! :bucket: Clearing the queue..."
      );
      expect(mockReply).toHaveBeenNthCalledWith(2, context.message, "The queue has restarted.");

      // Actions
      expect(mockUseQueue).toHaveBeenCalledTimes(1);
      expect(mockUseQueue).toHaveBeenCalledWith(queueChannel);
      expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledTimes(1);
      expect(mockBulkDeleteMessagesWithIds).toHaveBeenCalledWith(
        queueEntries.map(entry => entry.queueMessageId),
        queueChannel
      );
      expect(mockQueueClear).toHaveBeenCalledTimes(1);
    }
  );
});
